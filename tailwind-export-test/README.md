# Design System - Tailwind Configuration

This package contains Tailwind v4 configuration generated from your design system.

## Files

- `theme.css` - Remaps Tailwind's default theme to your design tokens
- `tokens.css` - Direct token utilities (e.g., `.text-token-primary`)

## Installation

### Option 1: Use Remapped Theme (Recommended)

This makes Tailwind's standard classes use your design system:

```css
/* app.css */
@import "tailwindcss";
@import "./theme.css";
```

Now use standard Tailwind classes:
```html
<div class="bg-primary text-foreground p-4">
  <h1 class="text-2xl font-bold">Hello</h1>
</div>
```

### Option 2: Direct Token Utilities

For explicit token usage:

```css
/* app.css */
@import "tailwindcss";
@import "./tokens.css";
```

Use token-specific classes:
```html
<div class="bg-token-semantic-color-background-app">
  <p class="text-token-semantic-color-text-primary">Text</p>
</div>
```

### Option 3: Use Both

Import both files to get standard Tailwind classes + token utilities:

```css
@import "tailwindcss";
@import "./theme.css";
@import "./tokens.css";
```

## Dark Mode

Dark mode is automatically handled through:
- `@theme dark` for remapped classes
- `@media (prefers-color-scheme: dark)` for token utilities

## Updating

Re-export from Design Language Agent whenever your design system changes.
