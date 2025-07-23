import * as net from 'net';
import * as fs from 'fs';

function handleConnection(socket: net.Socket): void {
	let requestData = '';
	
	socket.on('data', (data) => {
		requestData += data.toString('utf-8');
		console.log('Raw request data:', JSON.stringify(requestData));
		
		if (requestData.includes('\r\n\r\n')) {
			const firstLine = requestData.split('\r\n')[0];
			const resourcePath = firstLine.split(' ')[1];
			
			let filePath = `htdocs${resourcePath}`;
			if (resourcePath.endsWith('/')) {
				filePath += 'index.html';
			}
			
			if (fs.existsSync(filePath)) {
				const fileContents = fs.readFileSync(filePath);
				const statusLine = 'HTTP/1.1 200 OK\r\n\r\n';
				socket.write(statusLine);
				socket.write(fileContents);
				socket.end();
				console.log(`Served file: ${filePath}`);
			} else {
				const response = 'HTTP/1.1 404 Not Found\r\n\r\nFile Not Found';
				socket.write(response);
				socket.end();
				console.log(`File not found: ${filePath}`);
			}
		}
	});
	
	socket.on('close', () => {
		console.log('Connection closing.');
	});
}

let server = net.createServer();
server.on('connection', handleConnection);
server.listen(9999, '127.0.0.1', () => {
	console.log('Server is listening...');
});