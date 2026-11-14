Tailwind CSS is most useful when its utility classes support a consistent layout. Start with spacing, reading width, and the main action, then use color and decoration to reinforce the structure.

For current setup instructions, use the [official Tailwind guide for Vite](https://tailwindcss.com/docs/installation/using-vite). Configuration differs between major versions, so avoid mixing installation steps from older tutorials.

## Start with a readable card

A useful tool card needs a clear name, a short explanation, and an action that describes the outcome.

```html
<article class="rounded-xl border border-slate-200 bg-white p-4">
  <h2 class="text-lg font-semibold text-slate-900">PDF to Excel</h2>
  <p class="mt-2 text-sm leading-6 text-slate-600">
    Extract tables from a text-based PDF into a spreadsheet.
  </p>
  <a class="mt-4 inline-flex min-h-11 items-center rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white"
     href="/tools/excel-pdf?mode=pdf-to-excel">
    Convert PDF to Excel
  </a>
</article>
```

The label tells the reader what opens next. You can try that workflow in our [Excel and PDF converter](/tools/excel-pdf?mode=pdf-to-excel).

## Add columns when there is enough room

Use a single-column layout as the starting point, then add columns at wider breakpoints:

```html
<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
  <!-- Tool cards -->
</div>
```

Check the content inside each card as well as the outer grid. Long filenames, buttons, and tables can overflow even when the grid itself is responsive.

## Keep typography and headings predictable

Use the page title for the main heading, section headings for groups, and smaller headings for individual cards. Choose the element for its meaning, then apply the visual size you need.

Avoid a global rule that makes every heading enormous. An admin dashboard title and a public landing-page title have different jobs.

## Test interaction, not only appearance

Tab through links and buttons and confirm that focus is visible. Check that a mobile drawer closes, returns focus, and does not leave the page locked after dismissal.

Review both light and dark themes. A dark card inside a permanently light page wrapper can look unfinished even if each component has its own dark-mode classes.

Finally, use a [code formatter](/tools/minify-beautify?mode=beautify) to inspect a messy sample, and keep shared components small enough to maintain.
