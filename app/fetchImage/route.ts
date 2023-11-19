import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');
    if (url === null) {
        return Response.json('No url provided.');
    }
    const image = await fetch('https://wiki.cassettebeasts.com' + url);
    return image;
}