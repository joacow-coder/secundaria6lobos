import { createRequestHandler } from "@tanstack/react-start/server";
import { getRouter } from "./router";

export default createRequestHandler({
  getRouter,
});
