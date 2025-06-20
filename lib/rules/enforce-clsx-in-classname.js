// eslint-plugin-use-clsx/lib/rules/enforce-clsx-in-classname.js
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Enforce using clsx for conditional classNames",
      category: "Best Practices",
      recommended: false,
    },
    fixable: "code",
    messages: {
      useClsx:
        "Use `clsx` instead of string interpolation or conditional logic inside `className`.",
    },
    schema: [],
  },

  create(context) {
    const sourceCode = context.getSourceCode();

    // Helper to get the text of a node
    const getText = (node) => sourceCode.getText(node);

    // Helper to determine if a node is a simple string literal
    const isStringLiteral = (node) =>
      node.type === "Literal" && typeof node.value === "string";

    // Helper to process expressions into clsx arguments (prefers object notation)
    const processExpressionToClsxArgs = (expression) => {
      let args = [];

      switch (expression.type) {
        case "TemplateLiteral":
          // For template literals, we try to break it down.
          // Example: `foo ${isActive ? 'active' : ''}` -> 'foo', { 'active': isActive }
          let currentString = "";
          expression.quasis.forEach((quasi, i) => {
            if (quasi.value.cooked) {
              currentString += quasi.value.cooked;
            }

            if (expression.expressions[i]) {
              if (currentString) {
                args.push(JSON.stringify(currentString)); // Add static string parts
                currentString = ""; // Reset current string
              }
              const expr = expression.expressions[i];
              const processedExprArgs = processExpressionToClsxArgs(expr);
              args = args.concat(processedExprArgs);
            }
          });
          if (currentString) {
            args.push(JSON.stringify(currentString));
          }
          break;

        case "ConditionalExpression":
          // Prefer object notation for simple conditional class names:
          // condition ? 'foo' : 'bar'  => { 'foo': condition, 'bar': !condition }
          // condition ? 'foo' : ''     => { 'foo': condition }
          // condition ? 'foo' : null   => { 'foo': condition }
          // condition ? 'foo' : undefined => { 'foo': condition }

          const condition = getText(expression.test);
          const consequent = expression.consequent;
          const alternate = expression.alternate;

          const objProps = [];

          if (isStringLiteral(consequent)) {
            const className = getText(consequent); // e.g., "'active'"
            objProps.push(`${className}: ${condition}`);
          } else {
            // Fallback for non-string consequent (e.g., another expression)
            args.push(`(${condition} && ${getText(consequent)})`);
          }

          if (isStringLiteral(alternate)) {
            const className = getText(alternate);
            // Only add if alternate is not an empty string or similar falsy value
            if (className !== "''" && className !== '""') {
              objProps.push(`${className}: !${condition}`);
            }
          } else if (
            alternate.type !== "Literal" ||
            (alternate.type === "Literal" &&
              alternate.value !== null &&
              alternate.value !== undefined)
          ) {
            // Fallback for non-string alternate or non-null/undefined literal
            args.push(`(!${condition} && ${getText(alternate)})`);
          }

          if (objProps.length > 0) {
            args.push(`{ ${objProps.join(", ")} }`);
          }
          break;

        case "BinaryExpression":
          // For binary expressions, we'll convert 'foo' + bar + 'baz'
          // to 'foo', bar, 'baz' if possible.
          // This requires recursive processing of left and right.
          const leftArgs = processExpressionToClsxArgs(expression.left);
          const rightArgs = processExpressionToClsxArgs(expression.right);
          args = args.concat(leftArgs, rightArgs);
          break;

        case "LogicalExpression": // e.g., 'foo' && isActive && 'bar'
          if (expression.operator === "&&") {
            const leftArgs = processExpressionToClsxArgs(expression.left);
            const rightArgs = processExpressionToClsxArgs(expression.right);
            args = args.concat(leftArgs, rightArgs);
          } else {
            // For '||' or other operators, just treat as a general expression
            args.push(getText(expression));
          }
          break;

        case "Literal":
          // Simple string literals can be passed directly
          if (isStringLiteral(expression)) {
            args.push(getText(expression));
          } else {
            args.push(getText(expression));
          }
          break;

        default:
          // For any other expression type, just take its text as is
          args.push(getText(expression));
          break;
      }
      return args;
    };

    return {
      JSXAttribute(node) {
        if (node.name.name !== "className") return;

        const value = node.value;
        if (!value || value.type !== "JSXExpressionContainer") return;

        const expression = value.expression;

        const checkForDisallowedPattern = (expr) => {
          if (!expr) return false;
          switch (expr.type) {
            case "TemplateLiteral":
              return expr.expressions.length > 0 || expr.quasis.length > 1; // Check for any interpolation or multiple parts
            case "BinaryExpression":
              return true; // Any binary expression indicates string concat or other
            case "ConditionalExpression":
              return true; // Any conditional expression
            case "LogicalExpression": // Consider `a && b` or `a || b` as needing clsx
              return expr.operator === "&&" || expr.operator === "||";
            default:
              return false;
          }
        };

        if (checkForDisallowedPattern(expression)) {
          context.report({
            node,
            messageId: "useClsx",
            fix(fixer) {
              const originalText = getText(expression);

              // Don't fix if clsx is already the top-level function call
              if (
                expression.type === "CallExpression" &&
                expression.callee.type === "Identifier" &&
                expression.callee.name === "clsx"
              ) {
                return null;
              }

              const clsxArguments = processExpressionToClsxArgs(expression);
              // Filter out empty strings that might result from parsing (e.g., from `'' + x`)
              const filteredArguments = clsxArguments.filter(
                (arg) => arg.trim() !== ""
              );

              // Ensure arguments are unique if possible (e.g., if multiple branches lead to the same static string)
              const uniqueArguments = [...new Set(filteredArguments)];

              const fixedText = `clsx(${uniqueArguments.join(", ")})`;

              return fixer.replaceText(expression, fixedText);
            },
          });
        }
      },
    };
  },
};
