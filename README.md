# KaicoHub

KaicoがGitHubで公開しているWebページとツールをまとめたポータルサイトです。

## 表示内容

- `Pages`: GitHub APIで `has_pages: true` と返る公開リポジトリを表示します。
- `Apps`: 最新のGitHub Releaseがある公開リポジトリを表示し、Releaseページへリンクします。

ポータル自身のリポジトリは一覧から除外します。

対象アカウントは `script.js` の `owner` で指定しています。

```js
const owner = "Kaico-hub";
```

GitHub APIが利用できない場合や対象がない場合は、空の一覧として表示されます。
