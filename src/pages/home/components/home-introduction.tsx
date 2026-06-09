export default function Introduction() {
  return (
    <div className="paragraph-wrap-outter mt-5 mb-10">
      <div className="paragraph-wrap-inner">
        <div className="text-3xl font-bold mb-5">D3.js 簡介</div>
        <div className="mb-5">
          D3.js
          是一個具備高度客製化能力的資料視覺化工具，泛用於繪製各類圖表以及資料驅動的概念展示圖，相較於其他資料視覺化工具，D3.js
          可以自定義更多樣式細節、加入多種互動操作及動畫特效。
        </div>
        <div>
          技術層面，D3.js 主要以 SVG
          的方式繪製各式圖表，較複雜的圖形則基於效能考量也提供 Canvas
          的替代方案，結合官方或開源項目提供的 GeoJSON
          格式資料，甚至能繪製出以地圖為基礎的幾何圖表。
        </div>
      </div>
    </div>
  );
}
