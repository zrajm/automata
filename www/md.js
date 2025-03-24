/*-*- js-indent-level: 2 -*-*/
// Copyright 2023-2025 by zrajm. Licenses: CC BY-SA (text), GPLv2 (code).

// Remove non-javascript stylesheet & load fancy one.
const head = document.head
head.insertAdjacentHTML('beforeend', '<link rel=stylesheet href=www/main.css>')
head.querySelector('link[href$="nojs.css"]').remove()

import(`./baremark.js`).then(() => {
  const t = document.querySelector('textarea')
  // Baremark rule for reading header style metadata & document title. There
  // are two different rules which might be added:
  //
  //   * addHeaderRule() -- Adds a rule for parsing email-style headers.
  //     Metadata will only be read from the first paragraph of the document,
  //     and only if it looks like email headers. (e.g. 'Author: <name>'). A
  //     header value may be continued on the next line, by indenting the
  //     continuation line.
  //
  //   * addTitleRule() -- Reads a heading at the top of the page as 'title'
  //     metadata, if no title was found in the headers. If a heading is read,
  //     it is also removed from the document. (If there is anything other than
  //     a heading at the top of the document, then no heading is read.)
  //
  // After parsing your markdown by invoking `baremark()` a call to
  // `baremarkHeaders()` (without arguments) will return an object with
  // metadata properties. The property names used are the same as in the
  // headers (but downcased).
  //
  // To add the rules, use:
  //
  //     baremarkHeader(baremark())   // gives the Baremark instance to use
  //        .addTitleRule()           //   add title rule
  //        .addHeaderRule()          //   add header rule
  //
  // You may then use read the values with `baremarkHeader().title`, or by
  // first setting a variable an read them from there
  //
  //    const metadata = baremarkHeader()
  //    metadata.title
  //
  const baremarkHeader = ((meta, rules) => Object.assign(
    (b => b ? (rules = b, baremarkHeader) : meta),
    {
      addHeaderRule: () => (rules.unshift([
        /^(\n*)(\w+:.*\n((\w+:|[\t ]).*\n)*)\n+/,
        (_, nl, txt) => (txt.split(/\n(?=\w)/).forEach(x => {
          const [_, name, value] = /^(\w+):(.*)/s.exec(x)
          meta[name.toLowerCase()] = value.trim().replace(/\s+/, ' ')
        }), nl)
      ]), baremarkHeader),
      addTitleRule: () => (rules.push([
        /^\n*<h(\d+)[^<>]*>(.*?)<\/h\1>/s,
        (w, n, title) => meta.title ? w : (meta.title = title, '')
      ]), baremarkHeader),
    }
  ))({})
  baremarkHeader(baremark())
    .addTitleRule()
    .addHeaderRule()

  const tmpl = (tmp, value) => value ? tmp.replace('%', value) : ''
  const join = (sep, ...x) => x.flat(Infinity).filter(x => x).join(sep)

  const html = baremark(t.innerHTML)
  const meta = baremarkHeader()
  const date = join('—', meta.date ?? meta.created, meta.updated)
  head.insertAdjacentHTML('beforeend', join('\n', [
    '<meta name=viewport content=width=device-width,initial-scale=1>',
    `<link rel=icon href="${meta.favicon ?? 'data:,'}" sizes=any>`,
    '<title>', join(' ', [
      tmpl(     '%', (meta.title ?? '').replace(/<br>/g, ' ')),
      tmpl('(by %)',  meta.author)
    ]),
    '</title>',
  ]))
  const [begYear] = (meta.date ?? meta.created ?? '').match(/\d{4}/) ?? []
  const [endYear] = (             meta.updated ?? '').match(/\d{4}/) ?? []
  t.outerHTML = tmpl(
    '<hgroup notoc>\n%\n</hgroup>\n', join('\n', [
      tmpl('<h1>%</h1>', meta.title),
      tmpl('<h2>%</h2>', join(', ', [
        tmpl('By %', meta.author),
        tmpl('<time>%</time>', date)
      ]))
    ]))
    + html
    + tmpl(
      '<footer>%</footer>',
      join('<br>', [
        tmpl(
          '© %, Uppsala, Sweden',
          join(' ', [
            tmpl('%', join('—', begYear, endYear)),
            tmpl('by %', meta.author)
          ])),
        tmpl('License: %', meta.license),
      ])
    )
})
/*[eof]*/
