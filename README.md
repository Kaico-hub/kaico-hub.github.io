# KaicoHub

KaicoがGitHubで公開しているページやツールをまとめたページです。

## 自動取得

公開リポジトリのうち、GitHub APIで `has_pages: true` と返るものを自動で一覧表示します。

現在の対象アカウントは `script.js` の `owner` で指定しています。

```js
const owner = "Kaico-hub";
```

APIが利用できない場合や、取得結果が空の場合はページ一覧を表示しません。
