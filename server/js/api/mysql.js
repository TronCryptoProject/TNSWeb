var mysql = require("mysql");
var mysql_pool;

function createMySQLPool(){
	if (!mysql_pool){
		mysql_pool = mysql.createPool({
			connectionLimit: 200,
			host : process.env.DB_HOST,
			user : process.env.DB_USER,
			password : process.env.DB_PASS,
			database : process.env.DB_DATABASE
		});
	}
	return mysql_pool;
}

module.exports = createMySQLPool();