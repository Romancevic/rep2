<?php

	$executionStartTime = microtime(true) / 1000;

	$url = 'https://cors-anywhere.herokuapp.com/http://api.weatherstack.com/forecast?access_key=e8e0eec9f566deb7dd6062bead55dc02&query='.$_POST['capital'];

	$ch = curl_init();
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch, CURLOPT_URL,$url);


	$result=curl_exec($ch);

	curl_close($ch);

	$decode = json_decode($result,true);

	$output = $decode;

	header('Content-Type: application/json; charset=UTF-8');

	echo json_encode($output);

?>
