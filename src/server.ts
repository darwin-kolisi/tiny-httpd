import * as net from 'net';
import * as fs from 'fs';

function handleConnection(socket: net.Socket): void {
	let requestData = '';
	
	socket.on('data', (data) => {
		requestData += data.toString('utf-8');
		console.log('Raw request data:\n', requestData);
		
		if (requestData.includes('\r\n\r\n')) {
			const firstLine = requestData.split('\r\n')[0];
			const resourcePath = firstLine.split(' ')[1];
			
			const routes: { [key: string]: string } = {
				'/': 'htdocs/index.html',
				'/about': 'htdocs/about.html',
			};
			
			const filePath = routes[resourcePath] || `htdocs${resourcePath}`;
			console.log('Serving file:', filePath);
			
			fs.access(filePath, fs.constants.F_OK, (err) => {
				if (err) {
					socket.write('HTTP/1.1 404 Not Found\r\n\r\nFile not found');
					socket.end();
					return;
				}
				
				fs.readFile(filePath, (err, fileContent) => {
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

let server = net.createServer();
server.on('connection', handleConnection);
server.listen(9999, '127.0.0.1', () => {
	console.log('Server is listening...');
});