<?php

	$executionStartTime = microtime(true) / 1000;

	$url = 'https://eventregistry.org/api/v1/article/getArticles?resultType=articles&keyword='.$_POST['country'].'&articlesCount=1&apiKey=f27e6895-8f65-4df1-a6bc-8caef60d73e8';

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
