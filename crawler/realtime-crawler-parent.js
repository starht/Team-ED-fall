import { splitArrayIntoChunks, getRoomId } from "./module.js";
import { fork } from "child_process";

const roomIds = await getRoomId();
const chunks = splitArrayIntoChunks(roomIds, 5);
// const region = process.argv[2]
const date = process.argv[2];
// console.log(chunks)

chunks.forEach(chunk => {
	const child = fork('realtime-crawler.js');
	child.send({ date, chunk });
	child.on('message', (result) => {
		if ('duration' in result) {
				console.log(`Total duration for this chunk: ${result.duration} milliseconds`);
		} else if (result.success) {
				console.log(`Crawling success for prId: ${result.prId}, roomId: ${result.roomId}`);
		} else {
				console.error(`Crawling failed for prId: ${result.prId}, roomId: ${result.roomId}, Error: ${result.error}`);
		}
});

	child.on('exit', (code) => {
			console.log(`Child process exited with code ${code}`);
	});
});