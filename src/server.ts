import * as net from 'net';
import * as fs from 'fs';
import * as path from 'path';

function handleConnection(socket: net.Socket): void {
	let requestData = '';
	
	socket.on('data', (data) => {
		requestData += data.toString('utf-8');

		if (requestData.includes('\r\n\r\n')) {
			const firstLine = requestData.split('\r\n')[0];
			const resourcePath = firstLine.split(' ')[1];
			console.log(`Request: ${firstLine}`);
			
			const routes: { [key: string]: string } = {
				'/': '/index.html',
				'/home': '/index.html',
				'/about': '/about.html',
			};
			
			const requestedFile = routes[resourcePath] || resourcePath;

			const publicDir = path.resolve('./htdocs');
			const safeFilePath = path.join(publicDir, requestedFile);
			if (!safeFilePath.startsWith(publicDir)) {
				socket.write('HTTP/1.1 403 Forbidden\r\n\r\nAccess Denied');
				socket.end();
				return;
			}
			
			fs.access(safeFilePath, fs.constants.F_OK, (err) => {
				if (err) {
					socket.write('HTTP/1.1 404 Not Found\r\n\r\nFile Not Found');
					socket.end();
					return;
				}
				
				fs.readFile(safeFilePath, (err, fileContent) => {
					if (err) {
						socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\nFailed to read file');
						socket.end();
						return;
					}
					
					socket.write('HTTP/1.1 200 OK\r\n\r\n');
					socket.write(fileContent);
					socket.end();
				});
			});
		}
	});
	
	socket.on('error', (err) => {
		console.error('Socket error:', err.message);
	});
	
	socket.on('close', () => {
		console.log('Connection closing.');
	});
}

const server = net.createServer(handleConnection);

server.listen(9999, '127.0.0.1', () => {
	console.log('Server is listening on http://127.0.0.1:9999');
	console.log('Serving files from the ./htdocs directory');
});