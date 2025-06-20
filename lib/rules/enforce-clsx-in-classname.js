// eslint-plugin-use-clsx/lib/rules/enforce-clsx-in-classname.js
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Enforce using clsx for conditional classNames",
      category: "Best Practices",
      recommended: false,
    },
    fixable: null,
    messages: {
      useClsx:
        "Use `clsx` instead of string interpolation or conditional logic inside `className`.",
    },
    schema: [],
  },

  create(context) {
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
              // Disallow any interpolated expressions (e.g., `${className}`)
              return expr.expressions.length > 0;
            case "BinaryExpression":
              // Disallow any string concatenation (e.g., 'foo' + className)
              return true;
            case "ConditionalExpression":
              return true;
            default:
              return false;
          }
        };

        if (checkForDisallowedPattern(expression)) {
          context.report({
            node,
            messageId: "useClsx",
          });
        }
      },
    };
  },
};
