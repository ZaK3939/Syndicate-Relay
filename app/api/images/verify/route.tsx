import { ImageResponse } from "next/og";
import { Card } from "../../../components/Card";
import { CARD_DIMENSIONS, NEXT_PUBLIC_URL } from "../../../config";

export async function GET() {
  return new ImageResponse(
    (
      <Card
        message="Sorry, you don't have any verified accounts. Please verify your account."
        image={`${NEXT_PUBLIC_URL}/horse.png`}
      />
    ),
    CARD_DIMENSIONS,
  );
}
