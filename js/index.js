function setCookie(key,value) {
    var date = new Date();
    date.setTime(date.getTime() + 24*60*60*1000);
    var cookie = key + "=" + value + ";expires=" + date.toUTCString() + ";";
    document.cookie = cookie;
}

function getCookie(key) {
    var name = key + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}
$(document).ready(function(){
	var url = "https://sktes2qcoc.execute-api.us-east-1.amazonaws.com/modernservice/orchestrator";
	
	$("#login").click(function(){
		$.ajax({
			url:url,
			type:"POST",
			data:JSON.stringify({
				"operation":"login",
				"email": $("#email").val(),
				"password": $("#password").val(),
			}),
			contentType:"application/json; charset=utf-8",
			dataType:"json",
			crossDomain: true,
			success: function(data){
				var res = JSON.parse(data);
				if(res['statusCode'] == 200){
					var token = res['headers']['userToken'];
					setCookie('userToken', token);
					window.location.href = 'list.html';
				}else if(res['statusCode'] == 401){
					window.location.href = 'loginFail.html';
				}else{
					alert("Ops! Please log again!");
				}
			},
			error:function(data){
		    	window.location.href = 'loginFail.html';
		    }  
		});
	});

	$("#signup").click(function(){
		window.location.href = 'signup.html';
	});

	$("#history").click(function(){
		$.ajax({
			url:url,
			type:"POST",
			data:JSON.stringify({
				"operation":"payHistory",
				"userToken": getCookie("userToken")
			}),
			crossDomain: true,
			contentType:"application/json; charset=utf-8",
			dataType:"json",
			success: function(data){
				sessionStorage.setItem('orders',data);
				window.location.href = "payHistory.html";
			}
		});
	});

	$("#account").click(function(){
		$.ajax({
			url:url,
			type:"POST",
			data:JSON.stringify({
				"operation":"checkAccount",
				"userToken": getCookie("userToken")
			}),
			crossDomain: true,
			contentType:"application/json; charset=utf-8",
			dataType:"json",
			success: function(data){
				sessionStorage.setItem('accountInfo',data);
				window.location.href = "account.html";
			}
		});
	});

	$("#submitSignup").click(function(){
		var username = $("#username").val();
		var email = $("#email").val();
		var password = $("#password").val();
		var verify = $("#verify").val();

		if(password != verify){
			alert("Passwords don't match!");
		}else{
			$.ajax({
				url:url,
				type:"POST",
				data: JSON.stringify({
					"operation":"signup",
					"username": username,
					"email": email,
					"password": password
				}),
				crossDomain: true,
				contentType:"application/json; charset=utf-8",
				dataType:"json",
				success: function(data){
					var res = JSON.parse(data);
					if(res['statusCode'] == 200){
						alert("Signup Successfully!");
						window.location.href = "login.html";
					}else{
						alert(res['message']);
					}
				}
			});
		}
	});

	$(".purchase").click(function(){
		$("#productName").text($(this).attr("description"));
		$("#chargeAmount_modal").val($(this).attr("chargeAmount"));
		$("#description_modal").val($(this).attr("description"));
		$("#transaction").modal('show');
	});
});