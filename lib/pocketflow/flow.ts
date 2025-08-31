import { Flow } from "pocketflow";
import {
  ResolveEmailNode,
  ConfirmEmailNode,
  AwaitConfirmationNode,
  BindIdentityNode,
  GenerateResponseNode,
} from "./nodes";

export function createAgentFlow(): Flow {
  const resolve = new ResolveEmailNode();
  const confirm = new ConfirmEmailNode();
  const awaitConfirm = new AwaitConfirmationNode();
  const bind = new BindIdentityNode();
  const respond = new GenerateResponseNode();

  resolve.on("needs_confirmation", confirm);

  confirm.on("await_confirmation", awaitConfirm);

  awaitConfirm.on("confirmed", bind);
  awaitConfirm.on("rejected", resolve);
  awaitConfirm.on("await_confirmation", awaitConfirm); // loop until clear

  bind.on("default", respond);
  bind.on("error", resolve); // fall back

  return new Flow(resolve);
}
