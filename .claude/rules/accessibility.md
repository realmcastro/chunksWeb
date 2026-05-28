# Rule: Accessibility

## Governing Agent
**frontend-architect**

## Trigger
Creating or modifying UI components.

## Constraints
- Semantic HTML elements (button, nav, main, section, article)
- ARIA labels on interactive elements without visible text
- Keyboard navigation support (focus management, tab order)
- Color contrast ratios meet WCAG 2.1 AA
- Alt text on images

## Validations
- [ ] Interactive elements are focusable and keyboard-operable
- [ ] Form inputs have associated labels
- [ ] Error messages announced to screen readers
- [ ] No information conveyed by color alone
- [ ] Skip navigation link present

## Anti-Patterns
- `<div onClick>` instead of `<button>`
- Missing alt text or alt="" on meaningful images
- Focus traps without escape
- Hover-only interactions with no keyboard equivalent
