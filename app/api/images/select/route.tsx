import { ImageResponse } from "next/og";
import { Card } from "../../../components/Card";
import { CARD_DIMENSIONS } from "../../../config";

export async function GET() {
  return new ImageResponse(
    <Card message="You're eligible for a free mint." />,
    CARD_DIMENSIONS,
  );
}
