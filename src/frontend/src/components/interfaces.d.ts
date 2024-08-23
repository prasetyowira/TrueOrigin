import { ReactNode } from "react";

export type Menu = {
    path: string;
    logo?: ReactNode | string;
    name: string;
};