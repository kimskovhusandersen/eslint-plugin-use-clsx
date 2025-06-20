/**
 * @fileoverview Enforce using clsx for conditional classNames
 * @author Your Name
 */
"use strict";

import { RuleTester } from "eslint";
import actualRule from "../../../lib/rules/enforce-clsx-in-classname.js";

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
});

ruleTester.run("enforce-clsx-in-classname", actualRule, {
  // Use actualRule here
  valid: [
    // --- Valid Cases (should NOT be reported) ---
    { code: `<div className="static-class">Hello</div>` },
    { code: `<div className={clsx('static', active && 'active')}>Hello</div>` },
    { code: `<div className={clsx({ 'active': active })}>Hello</div>` },
    { code: `<div className={clsx('foo', 'bar')}>Hello</div>` },
    { code: `<div className={clsx(someVar)}>Hello</div>` },
    {
      code: `<div className={clsx('base', active && 'active', isDisabled && 'disabled')}>Hello</div>`,
    },
    {
      code: `<div className={clsx('foo', { 'bar': condition, 'baz': !condition })}>Hello</div>`,
    },
    {
      code: `<div className={clsx(isActive ? 'active' : 'inactive')}>Hello</div>`,
    },
  ],

  invalid: [
    // --- Invalid Cases (should be reported AND fixed) ---

    // Template Literal - simple interpolation
    {
      code: `<div className={\`base \${isActive ? 'active' : ''}\`}>Hello</div>`,
      output: `<div className={clsx("base ", { 'active': isActive })}>Hello</div>`,
      errors: [{ messageId: "useClsx" }],
    },
    {
      code: `<div className={\`\${isActive ? 'active' : 'inactive'}\`}>Hello</div>`,
      output: `<div className={clsx({ 'active': isActive, 'inactive': !isActive })}>Hello</div>`,
      errors: [{ messageId: "useClsx" }],
    },
    {
      code: `<div className={\`\${someVar}\`}>Hello</div>`,
      output: `<div className={clsx(someVar)}>Hello</div>`,
      errors: [{ messageId: "useClsx" }],
    },
    {
      code: `<div className={\`foo \${bar} baz\`}>Hello</div>`,
      output: `<div className={clsx("foo ", bar, " baz")}>Hello</div>`,
      errors: [{ messageId: "useClsx" }],
    },
    // Template literal with complex nested expressions
    {
      code: `<div className={\`foo \${isActive && 'active'} \${isAdmin ? 'admin' : ''}\`}>Hello</div>`,
      output: `<div className={clsx("foo ", isActive, 'active', " ", { 'admin': isAdmin })}>Hello</div>`,
      errors: [{ messageId: "useClsx" }],
    },

    // Binary Expression - string concatenation
    {
      code: `<div className={"foo" + (isActive ? "active" : "")}>Hello</div>`,
      output: `<div className={clsx("foo", { "active": isActive })}>Hello</div>`,
      errors: [{ messageId: "useClsx" }],
    },
    {
      code: `<div className={"foo" + " bar"}>Hello</div>`,
      output: `<div className={clsx("foo", " bar")}>Hello</div>`,
      errors: [{ messageId: "useClsx" }],
    },
    {
      code: `<div className={someVar + " bar"}>Hello</div>`,
      output: `<div className={clsx(someVar, " bar")}>Hello</div>`,
      errors: [{ messageId: "useClsx" }],
    },
    {
      code: `<div className={'static ' + (isActive ? 'active' : '') + (isAdmin ? ' admin' : '')}>Hello</div>`,
      output: `<div className={clsx('static ', { 'active': isActive }, { ' admin': isAdmin })}>Hello</div>`,
      errors: [{ messageId: "useClsx" }],
    },

    // Conditional Expression
    {
      code: `<div className={isActive ? 'active' : 'inactive'}>Hello</div>`,
      output: `<div className={clsx({ 'active': isActive, 'inactive': !isActive })}>Hello</div>`,
      errors: [{ messageId: "useClsx" }],
    },
    {
      code: `<div className={isAdmin ? 'admin-only' : ''}>Hello</div>`,
      output: `<div className={clsx({ 'admin-only': isAdmin })}>Hello</div>`,
      errors: [{ messageId: "useClsx" }],
    },
    {
      code: `<div className={isAdmin ? 'admin-only' : null}>Hello</div>`,
      output: `<div className={clsx({ 'admin-only': isAdmin })}>Hello</div>`,
      errors: [{ messageId: "useClsx" }],
    },
    {
      code: `<div className={isAdmin ? 'admin-only' : undefined}>Hello</div>`,
      output: `<div className={clsx((!isAdmin && undefined), { 'admin-only': isAdmin })}>Hello</div>`,
      errors: [{ messageId: "useClsx" }],
    },
    {
      code: `<div className={isAdmin ? 'admin-only' : 0}>Hello</div>`, // 0 is falsy, should be omitted
      output: `<div className={clsx((!isAdmin && 0), { 'admin-only': isAdmin })}>Hello</div>`,
      errors: [{ messageId: "useClsx" }],
    },
    {
      code: `<div className={isActive ? activeClass : 'inactive'}>Hello</div>`, // Non-literal consequent
      output: `<div className={clsx((isActive && activeClass), { 'inactive': !isActive })}>Hello</div>`,
      errors: [{ messageId: "useClsx" }],
    },

    // Logical Expression
    {
      code: `<div className={isActive && 'show-active'}>Hello</div>`,
      output: `<div className={clsx(isActive, 'show-active')}>Hello</div>`,
      errors: [{ messageId: "useClsx" }],
    },
    {
      code: `<div className={isAdmin || 'default-user'}>Hello</div>`,
      output: `<div className={clsx(isAdmin || 'default-user')}>Hello</div>`,
      errors: [{ messageId: "useClsx" }],
    },
    {
      code: `<div className={isActive && isAdmin && 'super-user'}>Hello</div>`,
      output: `<div className={clsx(isActive, isAdmin, 'super-user')}>Hello</div>`,
      errors: [{ messageId: "useClsx" }],
    },
    {
      code: `<div className={isLoggedIn && someVariable && 'show-stuff'}>Hello</div>`,
      output: `<div className={clsx(isLoggedIn, someVariable, 'show-stuff')}>Hello</div>`,
      errors: [{ messageId: "useClsx" }],
    },

    // Mixed complex expressions
    {
      code: `<div className={\`layout \${isActive ? 'active' : ''} \${isAdmin && 'admin-only'}\`}>Hello</div>`,
      output: `<div className={clsx("layout ", { 'active': isActive }, " ", isAdmin, 'admin-only')}>Hello</div>`,
      errors: [{ messageId: "useClsx" }],
    },
    {
      code: `<div className={('base ' + (isActive ? 'active' : '')) + (isAdmin ? ' admin' : '')}>Hello</div>`,
      output: `<div className={clsx('base ', { 'active': isActive }, { ' admin': isAdmin })}>Hello</div>`,
      errors: [{ messageId: "useClsx" }],
    },
  ],
});
