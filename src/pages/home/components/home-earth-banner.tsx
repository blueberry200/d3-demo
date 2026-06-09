import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";
import type { GeometryObject, Topology } from "topojson-specification";
import type { Feature, Geometry } from "geojson";
import versor from "versor";

const sphere = { type: "Sphere" } as const; // 球體表面的 GeoJSON

type LandFeature = Feature<Geometry>; // 版塊的 GeoJSON
type Vec3 = [number, number, number]; // 3D 向量
type Quaternion = [number, number, number, number]; // 四元數

export default function EarthBanner() {
  // 供 D3.js 完全掌控的容器
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!wrapRef.current) return;

    // 繪製地球的畫布寬度
    const width = 600;

    // 正射投影，將經緯度轉換成 fitWidth 內建座標的函式
    const projection = d3.geoOrthographic().fitWidth(width, sphere);
    // 初始旋轉角度
    projection.rotate([0, 30, 30]);

    // 取得經緯度資料的經緯度邊界
    const [[, y0], [, y1]] = d3.geoPath(projection).bounds(sphere);
    // 計算畫布高度
    const height = Math.ceil(y1 - y0);

    // 建立畫布
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) return;

    // 設備像素比，影響 canvas 解析度
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr; // canvas 橫向所需的解析度，畫布寬度 x 設備像素比
    canvas.height = height * dpr; // canvas 縱向所需的解析度，畫布高度 x 設備像素比
    canvas.style.width = `${width}px`;
    canvas.style.maxWidth = "90%";
    canvas.style.height = "auto";
    canvas.style.touchAction = "none"; // 禁止瀏覽器預設捲動頁面、多指縮放
    canvas.style.userSelect = "none"; // 禁止瀏覽器預設拖曳及雙擊選擇文字
    canvas.style.cursor = "grab";

    // 依照 canvas 解析度縮放畫布上下文，讓畫面座標可以對齊canvas實際座標
    context.scale(dpr, dpr);

    // 將 GeoJSON 格式的資料轉換為 canvas 路徑
    // 原理：挑出 GeoJSON 的經緯度資料，透過傳入的 projection 函式將經緯度轉換成平面座標
    // 再依據傳入的 context 將平面座標繪製成路徑
    const path = d3.geoPath(projection, context);

    // GeoJSON 格式的經緯度資料，type: MultiLineString
    const graticule = d3.geoGraticule10();
    // 地球的 GeoJSON 資料
    let landData: LandFeature | null = null;
    // 循環執行的動畫 Web API 回傳的 ID，用來取消動畫
    let frameId = 0;
    let isDragging = false;

    // 拖曳時的速度，以兩次 gragged 之間的距離和時間計算
    let velocityLambda = 0; // 經度方向旋轉速度
    let velocityPhi = 0; // 緯度方向旋轉速度

    const AUTO_ROTATE_SPEED = 0.2; // 自動旋轉速度
    const INERTIA_DECAY = 0.9; // 慣性衰減比例，越接近 1 滑越久
    const MIN_VELOCITY = 0.01; // 自轉閾值，低於這個速度後恢復自動旋轉

    // 將滑鼠指標轉換成 fitWidth 內建座標
    const getPointer = (
      event: d3.D3DragEvent<HTMLCanvasElement, unknown, unknown>,
    ): [number, number] => {
      // canvas 畫面寬度及高度，已經過縮放的值
      const rect = canvas.getBoundingClientRect();

      return [event.x * (width / rect.width), event.y * (height / rect.height)];
    };

    // 渲染畫布
    const render = (land: LandFeature) => {
      // 清空畫布
      context.clearRect(0, 0, width, height);

      // 繪製球體底色
      context.beginPath();
      path(sphere);
      context.fillStyle = "#fff";
      context.fill();

      // 繪製經緯線網格
      context.beginPath();
      path(graticule);
      context.strokeStyle = "#ddd";
      context.stroke();

      // 繪製版塊
      context.beginPath();
      path(land);
      context.fillStyle = "#000";
      context.fill();

      // 繪製球體邊框
      context.beginPath();
      path(sphere);
      context.strokeStyle = "#000";
      context.stroke();
    };

    // 循環執行的動畫
    const animate = () => {
      if (!landData) {
        // 尚未載入地圖資訊時，僅觸發懂畫循環
        frameId = requestAnimationFrame(animate);
        return;
      }

      // dragged 時不執行動畫，僅執行在自轉跟慣性轉動
      if (!isDragging) {
        // 當前旋轉的角度
        const rotate = projection.rotate() as Vec3;

        if (
          Math.abs(velocityLambda) > MIN_VELOCITY ||
          Math.abs(velocityPhi) > MIN_VELOCITY
        ) {
          // 慣性速度大於自轉閾值，依循慣性旋轉
          projection.rotate([
            rotate[0] + velocityLambda,
            rotate[1] + velocityPhi,
            rotate[2],
          ]);

          // 慣性轉速衰減
          velocityLambda *= INERTIA_DECAY;
          velocityPhi *= INERTIA_DECAY;
        } else {
          // 慣性速度小於自轉閾值，執行自轉，不再依循慣性旋轉
          projection.rotate([
            rotate[0] + AUTO_ROTATE_SPEED,
            rotate[1],
            rotate[2],
          ]);
        }

        // 旋轉角度決定好之後，執行渲染
        render(landData);
      }

      // 循環下一輪動畫
      frameId = requestAnimationFrame(animate);
    };

    // D3.js 的 drag 事件設定，回傳 drag 行為物件，供 D3 的 selection 使用 call 方法綁定
    const createDrag = (
      projection: d3.GeoProjection,
      renderLand: LandFeature,
    ) => {
      let v0: Vec3; // 拖曳開始時「手指碰到球面的位置」，用經緯度轉換成 3D 向量，三個值為 [x, y, z]
      let r0: Vec3; // 拖曳開始時「地球本身的旋轉角度」，三個值為 [lambda, phi, gamma]
      let q0: Quaternion; // 拖曳開始時「地球本身的旋轉角度」，轉換成四元數，方便跟 v0：[x, y, z] 做旋轉計算，在換算回 [lambda, phi, gamma] 格式，做旋轉使用

      let lastRotate: Vec3 | null = null; // 用來記錄前一次 dragged 的旋轉角度，用來計算慣性旋轉
      let lastTime = 0; // 用來記錄前一次 dragged 的時間，用來計算慣性旋轉

      function dragstarted(
        event: d3.D3DragEvent<HTMLCanvasElement, unknown, unknown>,
      ) {
        // dragging 狀態開啟，阻止自轉跟慣性轉動
        isDragging = true;
        // 慣性旋轉速度歸零
        velocityLambda = 0;
        velocityPhi = 0;

        canvas.style.cursor = "grabbing";

        // 將滑鼠指標轉換成 fitWidth 內建座標
        const point = getPointer(event);
        // 將 fitWidth 內建座標轉換成經緯度
        const lonLat = projection.invert?.(point);
        if (!lonLat) return;

        // 將經緯度轉換成 3D 向量
        v0 = versor.cartesian(lonLat);
        // 取得當前旋轉角度
        r0 = projection.rotate() as Vec3;
        // 將旋轉角度轉換成四元數
        q0 = versor(r0);

        lastRotate = r0; // 記錄初始 dragged 的旋轉角度
        lastTime = performance.now(); // 記錄初始 dragged 的時間
      }

      function dragged(
        event: d3.D3DragEvent<HTMLCanvasElement, unknown, unknown>,
      ) {
        if (!v0 || !q0 || !r0) return;

        // 將滑鼠指標轉換成 fitWidth 內建座標
        const point = getPointer(event);
        // 以拖曳開始時的旋轉角度做為基準，將 fitWidth 內建座標轉換成經緯度
        const lonLat = projection.rotate(r0).invert?.(point);
        if (!lonLat) return;

        // 將經緯度轉換成 3D 向量
        const v1 = versor.cartesian(lonLat);
        // versor.delta 用來計算拖曳開始位置跟當前位置，兩者 3D 向量間的距離，回傳的是旋轉所需的四元數
        // versor.multiply 計算兩個四元數的乘積，從旋轉的層面等同於旋轉總和
        const q1 = versor.multiply(q0, versor.delta(v0, v1));
        // 將旋轉角度的四元數轉換回 [lambda, phi, gamma]
        const nextRotate = versor.rotation(q1);

        // 執行旋轉後渲染
        projection.rotate(nextRotate);
        render(renderLand);

        // 取得動畫層級時間
        const now = performance.now();

        if (lastRotate) {
          // 計算兩個  dragged 間的時間差
          // 避免時間間隔太短造成過高的轉速，以 16ms 為下限，16ms 相當於 60fps
          const dt = Math.max(now - lastTime, 16);

          // 計算慣性轉速
          // 慣性轉速 = (下一次旋轉角度 - 上一次旋轉角度) / 時間間隔 = 1ms 的旋轉角度差
          // 1ms 的旋轉角度差，乘以 16，獲得 16ms 的旋轉角度差，相當於 60fps 的角度差
          velocityLambda = ((nextRotate[0] - lastRotate[0]) / dt) * 16;
          velocityPhi = ((nextRotate[1] - lastRotate[1]) / dt) * 16;
        }

        // 記錄旋轉角度、時間，以便下一輪 dragged 計算慣性轉速
        lastRotate = nextRotate;
        lastTime = now;
      }

      // 停止拖曳
      function dragended() {
        // 關閉 dragging，讓轉速遵循慣性或是自轉
        isDragging = false;
        canvas.style.cursor = "grab";
      }

      // 回傳 drag 行為物件，供 D3 的 selection 使用 call 方法綁定
      return d3
        .drag<HTMLCanvasElement, unknown>()
        .container(canvas)
        .touchable(() => true)
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    };

    // 初始化函式，載入地圖資訊跟啟動動畫循環
    const init = async () => {
      // 讀取地圖資訊 (板塊)，格式為 TopoJSON，一種將 GeoJSON 格式的區塊間邊界共用的壓縮版地理資訊格式
      const res = await fetch(`${import.meta.env.BASE_URL}data/land-110m.json`);

      if (!res.ok) {
        throw new Error("讀取 land-110m.json 失敗");
      }

      // res.json() 將 fetch response 物件轉成字串並 parse 成 JavaScript 物件
      const world = (await res.json()) as Topology<{
        land: GeometryObject;
      }>;

      // 將 TopoJSON 的地圖資訊轉換成 GeoJSON 的格式
      const land = feature(world, world.objects.land) as LandFeature;
      landData = land;

      // 綁上 drag 事件並初次繪製地圖
      d3.select(canvas).call(createDrag(projection, land));
      render(land);

      // 初次觸發循環動畫
      frameId = requestAnimationFrame(animate);
    };

    // 準備畫布
    wrapRef.current.innerHTML = "";
    wrapRef.current.appendChild(canvas);

    // 初始化
    void init();

    // 清空動畫、停止事件監測、刪除畫布
    return () => {
      cancelAnimationFrame(frameId);
      d3.select(canvas).on(".drag", null);
      canvas.remove();
    };
  }, []);

  return (
    <div className="stack flex-center p-10">
      <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-5">
        D3.js 範例展示網站
      </div>
      <div className="text-center italic mb-10">
        - 本網站主要以 D3.js 嘗試多種圖表實踐，其中數據多為模擬資料，歡迎閱覽 -
      </div>
      <div className="flex justify-center mb-10" ref={wrapRef} />
      <div className="text-center mb-10">
        ( 搭配開源 GeoJSON
        資料繪製而成的地球儀，可透過拖曳來旋轉球體，拖曳放開後有模擬慣性的動畫效果
        )
      </div>
    </div>
  );
}
