declare module 'pdf417-generator' {
    export function draw(
        code: string,
        canvas: HTMLCanvasElement,
        aspectRatio?: number,
        ecl?: number,
        devicePixelRatio?: number
    ): void;
}
