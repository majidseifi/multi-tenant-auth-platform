import "styled-components";
import type { TenantTheme } from "./theme/types";

declare module "styled-components" {
  export interface DefaultTheme extends TenantTheme {}
}
