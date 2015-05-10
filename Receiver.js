var net = require('net');
var mysql = require('mysql');
var http = require('http');

var tcpServerPort = 8899;

var server = net
		.createServer(
				function(socket) {
					console.log('Client connected to server');
					socket.on('close', function() {
						console.log('Client disconnected from server');
					});

					socket
							.on(
									'data',
									function(buffer) {
										// 'echo' server
										console.log('OmnikIP ' + socket.remoteAddress);

										console.log(buffer);
										console.log('\n');

										if (buffer.length > 31) { // Data send
											// is 31

											var invSerno = buffer.toString('ascii', 15, 31);
											var wifiSerno = buffer.readUInt32BE(4);
											var mainFirmWare = buffer.toString('ascii', 97, 116);
											var slaveFirmWare = buffer.toString('ascii', 117, 136);
											var Temperature = buffer.readInt16BE(31) / 10;
											var CurrentProduction = buffer.readInt16BE(59);
											var TodaysProduction = buffer.readInt16BE(69) / 100;
											var TotalProduction = buffer.readUInt32BE(71) / 10;
											var ActiveHours = buffer.readUInt32BE(75);

											console.log('timestamp: ' + new Date().toString());

											// console.log('omvormerSerno: ' +
											// buffer.toString('ascii', 15,
											// 31));
											console.log(invSerno);
											console.log('wifiSerno: ' + buffer.readUInt32BE(4));

											console.log('mainFirmWare: ' + buffer.toString('ascii', 97, 116));
											console.log('slaveFirmWare: ' + buffer.toString('ascii', 117, 136));

											console.log('temperatuur: ' + buffer.readInt16BE(31) / 10);
											console.log('huidig Wattage: ' + buffer.readInt16BE(59));
											console.log('kWh vandaag: ' + buffer.readInt16BE(69) / 100);
											console.log('kWh totaal: ' + buffer.readUInt32BE(71) / 10);

											console.log('Omvormer Voltage DC1: ' + buffer.readUInt16BE(33) / 10);
											console.log('Omvormer Voltage DC2: ' + buffer.readUInt16BE(35) / 10);
											console.log('Omvormer Voltage DC3: ' + buffer.readUInt16BE(37) / 10);

											console.log('Omvormer Ampere DC1: ' + buffer.readUInt16BE(39) / 10);
											console.log('Omvormer Ampere DC2: ' + buffer.readUInt16BE(41) / 10);
											console.log('Omvormer Ampere DC3: ' + buffer.readUInt16BE(43) / 10);

											console.log('Omvormer Voltage AC1: ' + buffer.readUInt16BE(51) / 10);
											console.log('Omvormer Voltage AC2: ' + buffer.readUInt16BE(53) / 10);
											console.log('Omvormer Voltage AC3: ' + buffer.readUInt16BE(55) / 10);

											console.log('Omvormer Ampere AC1: ' + buffer.readUInt16BE(45) / 10);
											console.log('Omvormer Ampere AC2: ' + buffer.readUInt16BE(47) / 10);
											console.log('Omvormer Ampere AC3: ' + buffer.readUInt16BE(49) / 10);

											console.log('Frequency in Hz: ' + buffer.readUInt16BE(57) / 100);

											console.log('aantal uur actief: ' + buffer.readUInt32BE(75));

											var connection = mysql.createConnection({
												host : 'localhost',
												user : 'omnik',
												password : 'omnik',
												database : 'omnik',
											});

											// Try to add data to database
											connection.connect(function(error, results) {
												if (error) {
													console.log('Connection Error: ' + error.message);
													return;
												}
												console.log('Connected to MySQL');
											});

											var values = [ invSerno, wifiSerno, mainFirmWare, slaveFirmWare, Temperature, CurrentProduction,
													TodaysProduction, TotalProduction, ActiveHours ];
											connection
													.query(
															'INSERT INTO myOmnikData SET invSerno = ?, wifiSerno = ?, mainFirmWare = ?, slaveFirmWare = ?, Temperature = ?, CurrentProduction = ?, TodaysProduction = ?, TotalProduction = ?, activeHours = ?',
															values, function(error, results) {
																if (error) {
																	console.log('ClientReady Error: ' + error.message);
																	connection.end();
																	return;
																}
																console.log('Inserted: ' + results.affectedRows + ' row.');
																console.log('Id inserted: ' + results.insertId);
															});

											connection.end();

										}

									});

					socket.on('error', function(err) {
						console.log('Error: ' + err.soString());
					});
				}).listen(tcpServerPort);

console.log('Server listening on port ' + tcpServerPort);

function twoDigits(d) {
	if (0 <= d && d < 10)
		return "0" + d.toString();
	if (-10 < d && d < 0)
		return "-0" + (-1 * d).toString();
	return d.toString();
}

function getSQL(callback) {
	var mysql = require('mysql');
	var connection = mysql.createConnection({
		host : 'localhost',
		user : 'omnik',
		password : 'omnik',
		database : 'omnik',
	});

	connection.connect();
	var json = '';
	var date = new Date();
	var today = date.getUTCFullYear() + "-" + twoDigits(1 + date.getUTCMonth()) + "-" + twoDigits(date.getUTCDate()) + "%";
	var query = 'SELECT * FROM `myOmnikData` WHERE `timeStamp` LIKE ' + "'" + today + "'";
	console.log(today);
	console.log(query);
	connection.query(query, function(err, results, fields) {
		if (err)
			return callback(err, null);

		// console.log('The query-result is: ', results[0]);

		json = 'angular.callbacks._0(' + JSON.stringify(results) + ')';

		connection.end();
		// console.log('JSON-result:', json);
		callback(null, json);
	});
}

http.createServer(function(req, res) {
	console.log('Receving request...');
	var callback = function(err, result) {
		res.writeHead(200, {
			"Content-Type" : "application/json"
		});
		console.log('json:', result);
		res.end(result);
	};

	getSQL(callback);

}).listen(3000);
