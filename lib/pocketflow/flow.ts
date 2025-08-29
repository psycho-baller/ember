import { Flow } from "pocketflow";
import { ResolveEmailNode, ConfirmEmailNode, GenerateResponseNode } from "./nodes";


export function createAgentFlow(): Flow {
  const resolve = new ResolveEmailNode();
  const confirm = new ConfirmEmailNode();
  const respond = new GenerateResponseNode();


  resolve.on("confirmed", respond);
  resolve.on("needs_confirmation", confirm);


  return new Flow(resolve);
}