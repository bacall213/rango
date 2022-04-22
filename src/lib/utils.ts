import { Rgba } from "../types/types";

export function getLettersFromNumber(hintNumber: number): string {
	const codePointLowerA = 97;
	const lettersNumbers: number[] = [hintNumber];
	let result = "";
	let div: number;
	let sp = 0;

	// At the end of this while loop we will have an array with the numbers of the letters
	// from 0 (a) to 25 (z) in reversed order, for example: 35 -> [9, 0] -> ["j", "a"] -> "aj"
	while (sp < lettersNumbers.length) {
		if (lettersNumbers[sp]! > 25) {
			div = Math.floor(lettersNumbers[sp]! / 26);
			lettersNumbers[sp + 1] = div - 1;
			lettersNumbers[sp] %= 26;
		}

		sp += 1;
	}

	for (const letterNumber of lettersNumbers) {
		result = String.fromCodePoint(codePointLowerA + letterNumber) + result;
	}

	return result;
}

export function getColorLuma(color: Rgba): number {
	// The resulting luma value range is 0..255, where 0 is the darkest and 255
	// is the lightest. Values greater than 128 are considered light.
	return 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
}

export function rgbaToRgb(
	rgbaString: string,
	backgroundRgbString: string
): string {
	const rgba = parseColor(rgbaString);
	const backgroundRgb = parseColor(backgroundRgbString);
	const rgb: Rgba = {
		r: Math.round((1 - rgba.a) * backgroundRgb.r + rgba.a * rgba.r),
		g: Math.round((1 - rgba.a) * backgroundRgb.g + rgba.a * rgba.g),
		b: Math.round((1 - rgba.a) * backgroundRgb.b + rgba.a * rgba.b),
		a: 1,
	};
	return stringFromRgba(rgb);
}

export function parseColor(color: string): Rgba {
	const [r, g, b, a] = color
		.replace(/[^\d.\s,]/g, "")
		.split(",")
		.map((v) => Number.parseFloat(v));

	return {
		r: r ?? 0,
		g: g ?? 0,
		b: b ?? 0,
		a: typeof a === "number" ? a : 1,
	};
}

function stringFromRgba(rgba: Rgba) {
	const colorType = rgba.a === 1 ? "rgb" : "rgba";
	return `${colorType}(${rgba.r}, ${rgba.g}, ${rgba.b}${
		rgba.a === 1 ? "" : ", rgba.a"
	})`;
}

// We assume colorString is in the format "rbg(r, g, b)" or "rbg(r, g, b, a)"
export function isRgb(colorString: string): boolean {
	return parseColor(colorString).a === 1;
}
