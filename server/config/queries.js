module.exports = {
    "insert": `INSERT INTO TNS (txid, aliasOwner, entities)
                VALUES ('{txid}','{aliasOwner}','{entities}');`,
    "fetch": `SELECT * from TNS
                WHERE aliasOwner = '{aliasOwner}' and timePosted > '{timePosted}'
                ORDER BY timePosted desc
                LIMIT 40;`
}