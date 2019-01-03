create table TNS(
	txid varchar(64) not null,
	aliasOwner varchar(34) not null,
	entities json not null,
	timePosted timestamp not null DEFAULT CURRENT_TIMESTAMP,
	primary key (txid, aliasOwner, timePosted)
);
