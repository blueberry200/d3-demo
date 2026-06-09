import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import ReactQueryProvider from "./provider/react-query-provider";
import "rc-pagination/assets/index.css";

import { store } from "./store";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <ReactQueryProvider>
      <App />
    </ReactQueryProvider>
  </Provider>,
);
