import captureWebsite from 'capture-website';
import filenamify from 'filenamify';
// import chromium from "chrome-aws-lambda"
import chromium from "@sparticuz/chromium-min"

// https://medium.com/@ankitkumar_62699/how-to-convert-the-json-object-json-file-to-a-csv-file-with-the-help-of-nodejs-5bd01a1cee50
import fs from 'fs';
import archiver from 'archiver';



// https://github.com/sindresorhus/capture-website?tab=readme-ov-file
const element = '.card-seo-facebook';
// const elementsHide = ["#linkedin", "#pinterest"];
// const options = {
// 	scrollToElement: element, inputType: "url", overwrite: true, emulateDevice: 'iPhone X', fullPage: false, waitForElement: element, hideElements: elementsHide
// };

const options = {
	element: element, inputType: "url", overwrite: true, scaleFactor: 2, quality: 0.5, waitForElement: element, type: "jpeg", launchOptions: {
		args: [
			'--no-sandbox',
			'--disable-setuid-sandbox'
		]
	}
};


let urls = [
	'https://www.nytimes.com/2024/04/24/world/middleeast/israel-hamas-rafah-invasion.html',
	'https://www.foxnews.com/politics/arizona-gov-katie-hobbs-vetoes-bipartisan-bill-combat-squatting-election-bills'
]

let output = []


function arrayToCSV(data) {
	let csv = data.map(row => Object.values(row));
	csv.unshift(Object.keys(data[0]));
	return csv.join('\n');
}



async function capture(url, filename, options) {

	console.log('Capturing screenshot:', url);
	const baseurl = "https://metatags.io/?url=";
	url = baseurl + encodeURIComponent(url);

	// https://github.com/sindresorhus/capture-website/issues/96
	await captureWebsite.base64(url, {
		launchOptions: {
			args: chromium.args,
			defaultViewport: chromium.defaultViewport,
			// executablePath: await chromium.executablePath,
			executablePath: await chromium.executablePath(
				"https://github.com/Sparticuz/chromium/releases/download/v121.0.0/chromium-v121.0.0-pack.tar"
			),
			headless: true
		}
	})

	await captureWebsite.file(url, filename, options);
	console.log('Screenshot captured:', filename);
}

let tempURL;
let filename;
let hostname;
let u;
let csvfile = "./tmp/_output.csv";

for (let i = 0; i < urls.length; i++) {

	const file_extension = "jpeg";

	tempURL = urls[i];
	tempURL = tempURL.split("/");
	filename = tempURL[tempURL.length - 1];
	filename = filename.split(".")[0];
	filename = filenamify(filename, { replacement: '-', maxLength: 50 });
	filename = filename.replace(",", "-");

	u = new URL(urls[i]);
	hostname = u.hostname;
	hostname = filenamify(hostname, { replacement: '-', maxLength: 50 });
	hostname = hostname.replace(".", "-");

	filename = hostname + "-" + filename + "." + file_extension;
	output.push({ url: urls[i], filename: filename });

	filename = "./tmp/" + filename;

	capture(urls[i], filename, options);

	fs.writeFile(csvfile, arrayToCSV(output), (err) => {
		if (err) throw err;
	});

	await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 5000) + 1000));

}




// Function to zip a directory
function zipDirectory(sourceDir, outPath) {
	const archive = archiver('zip', { zlib: { level: 9 } });  // Set the compression level
	const stream = fs.createWriteStream(outPath);

	return new Promise((resolve, reject) => {
		archive
			.directory(sourceDir, false)  // Add the directory to the archive
			.on('error', err => reject(err))
			.pipe(stream);

		stream.on('close', () => resolve());
		archive.finalize();
	});
}

// Example usage
zipDirectory('./tmp', './tmp/cards.zip').then(() => {
	console.log('Directory successfully zipped!');
}).catch(err => {
	console.error('An error occurred:', err);
});



