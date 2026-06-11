import type { Metadata } from "next";
import { NeighborhoodsClient } from "./NeighborhoodsClient";

export const metadata: Metadata = {
  title: "Quartiers | Estate Mangement",
};

export default function NeighborhoodsPage() {
  return <NeighborhoodsClient />;
}
