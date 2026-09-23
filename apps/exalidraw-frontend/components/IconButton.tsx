import { ReactNode } from "react";

export function IconButton({
    icon,
    activated,
    onClick
}:{
    icon:ReactNode,
    activated?:boolean,
    onClick:()=>void
}){
    return <div className={`pointer rounded-md  border-white p-2 bg-neutral-700 hover:bg-neutral-500 ${activated ? "text-emerald-600/70" : "text-white"}`} onClick={onClick}>
        {icon}
    </div>
}