"use client";
import Link from "next/link";

import { cn, buttonVariants } from "@/lib/utils";
import type { ComponentPropsWithoutRef } from "react";
import styles from "./styles.module.css";

interface Props extends ComponentPropsWithoutRef<typeof Link> {

}

function Component({
  className,
  ...props
}: Props) {


  return (
    <Link
      className={cn(buttonVariants({ variant: "secondary" }), styles.cta, className)}
      {...props}
    >
      <span>{props.children}</span>
    </Link>
  );
}

export default Component;
