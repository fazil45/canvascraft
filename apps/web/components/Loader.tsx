import { Bars } from "react-loader-spinner";

interface Loader {
  height: string;
  width: string;
  color: string;
  visible: boolean;
}

export function Loader({height, width, color, visible}:Loader) {
  return <Bars ariaLabel="bars-loading" height={height} width={width} color={color} visible={visible}/>;
}
