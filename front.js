//this script for toggle login form 
document.getElementById("showloginform").addEventListener("click", function() {
  const form = document.getElementById("login-form");
  form.classList.toggle("hidden-login-container");
  form.classList.toggle("visible-login-container");
});
//this script for toggle profile 
document.getElementById("showprofile").addEventListener("click", function() {
  const form = document.getElementById("profilecontainer");
  form.classList.toggle("hidden-profile-container");
  form.classList.toggle("visible-profile-container");
});
// this script for toggle address form
document.getElementById("addaddress").addEventListener("click", function() {
  const form = document.getElementById("addresscontainer");
  form.classList.toggle("hidden-addresscontainer");
  form.classList.toggle("visible-addresscontainer");
});
// this script for toggle to phone verification form
document.getElementById("shownewuserform").addEventListener("click", function() {
  const form = document.getElementById("hiddenForm");
  form.classList.toggle("hidden-verify-container");
  form.classList.toggle("visible-verify-container");
});

// get otp from the backend 
document.getElementById("getotp").addEventListener("click", async () => {
  const phoneNo = document.getElementById("phone").value;
  localStorage.setItem('phone', phoneNo);
  // Create an object of the data you want to send
  const data = { phoneNo};

  // Send it to backend without submitting the form
  const response = await fetch("http://localhost:3000/generate-otp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  const result = await response.json();
  if (result.success) {
  alert(`Your OTP is: ${result.otp}\nExpires at: ${result.expiresAt}`);
} else {
  alert(`${result.massage}`);
}
  console.log(result);
});
//this script is to verify otp
document.getElementById("verifyotp").addEventListener("click", async () => {
  const phoneNo = document.getElementById("phone").value;
  const otp = document.getElementById("otp").value;
   
  
  // Create an object of the data you want to send
  const data = { phoneNo,otp};

  // Send it to backend without submitting the form
  const response = await fetch("http://localhost:3000/verify-otp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  const result = await response.json();
  if (result.success) {
  
  alert("otp is verifyed");
  
    const f2 = document.getElementById("showregisterform");
  
      
      f2.style.display = "block";
  

} else {
  alert("wrong otp");
}
  console.log(result);
}); 

// program for sending password and  name and number to backend
document.getElementById("next").addEventListener("click", async () => {
  const userName = document.getElementById("name").value;
  const phoneNo = document.getElementById("enter-phone").value;
  const password = document.getElementById("enter-password").value;
  const verifypassword = document.getElementById("verifypassword").value;
  
   
  
  // Create an object of the data you want to send
  const data = { userName,phoneNo,password,verifypassword};

  // Send it to backend without submitting the form
  const response = await fetch("http://localhost:3000/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  const result = await response.json();
  if (result.success) {
  
  alert("new user created");
} else {
  alert("problem in user registration");
}
  console.log(result);
}); 
 //script for login form 
 document.getElementById("login").addEventListener("click", async () => {
  const userid = document.getElementById("userid").value;
  const password = document.getElementById("password").value;
   
  const data = {userid,password};
  
  const response = await fetch("http://localhost:3000/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  const result = await response.json();
 if (result.token) {
    localStorage.setItem("userToken", result.token);
    alert("Token saved in localStorage!");
  } else {
    alert("Login failed!");
  }

  console.log(result);
}); 


/* this script is testing on the show order card 

window.onload = function() {
  const token = localStorage.getItem("userToken");

  if (token) {
    fetch("http://localhost:5000/userdata", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    })
    .then(res => res.json())
    .then(data => {
      // ✅ Store response in object
      const orders = data.orders;

      console.log("User Data:", orders);
    })
    .catch(err => console.error("Fetch Error:", err));
  } else {
    console.log("No token found in localStorage.");
  }
};
*/ 
// this scripth is to show order card on screen

// ✅ Function to render orders dynamically
function renderOrders(orders) {
  const statusOrder = ["Received", "Under Process", "Dispatch", "Delivered"];
  const container = document.getElementById("orderContainer");
  container.innerHTML = ""; // Clear previous content

  orders.forEach(order => {
    const card = document.createElement("div");
    card.className = "order-card";

    const header = document.createElement("div");
    header.className = "order-header";

    const orderId = document.createElement("div");
    orderId.className = "order-id";
    orderId.textContent = `Order ID: ${order.orderId}`;

    const toggle = document.createElement("button");
    toggle.className = "toggle-btn";
    toggle.innerHTML = "&#9660;";

    header.appendChild(orderId);
    header.appendChild(toggle);
    card.appendChild(header);

    // 🆕 Order value line
    const orderValue = document.createElement("div");
    orderValue.style.marginTop = "8px";
    orderValue.style.color = "#2b6cb0";
    orderValue.style.fontWeight = "600";
    orderValue.textContent = `Order Value: ₹${order.orderValue}`;
    card.appendChild(orderValue);

    // 🏷️ Tag list
    const tagBox = document.createElement("div");
    tagBox.className = "tags";
    order.tags.forEach(tag => {
      const t = document.createElement("div");
      t.className = "tag";
      t.textContent = tag;
      tagBox.appendChild(t);
    });
    card.appendChild(tagBox);

    // 📦 Status bar
    const statusBar = document.createElement("div");
    statusBar.className = "status-bar hidden";

    statusOrder.forEach(status => {
      const step = document.createElement("div");
      step.className = "status-step";
      if (statusOrder.indexOf(status) <= statusOrder.indexOf(order.status)) {
        step.classList.add("completed");
      }

      const dot = document.createElement("div");
      dot.className = "dot";
      step.appendChild(dot);

      const label = document.createElement("div");
      label.className = "status-label";
      label.textContent = status;
      step.appendChild(label);

      statusBar.appendChild(step);
    });

    card.appendChild(statusBar);
    container.appendChild(card);

    // 🔁 Toggle logic
    toggle.addEventListener("click", () => {
      const expanded = tagBox.classList.toggle("expanded");
      statusBar.classList.toggle("hidden");
      toggle.style.transform = expanded ? "rotate(180deg)" : "rotate(0deg)";
    });
  });
}

// ✅ Run on page load
window.onload = function () {
  const token = localStorage.getItem("userToken");

  if (token) {
    fetch("http://localhost:5000/userdata", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        // ✅ Example: Assuming data.orders is an array of order objects
        const orders = data.orders;

        console.log("User Orders:", orders);

        // ✅ Render orders if data available
        if (orders && Array.isArray(orders) && orders.length > 0) {
          renderOrders(orders);
        } else {
          document.getElementById("orderContainer").innerHTML =
            "<p style='text-align:center;color:gray;'>No orders found.</p>";
        }
      })
      .catch(err => {
        console.error("Fetch Error:", err);
        document.getElementById("orderContainer").innerHTML =
          "<p style='text-align:center;color:red;'>Error loading orders.</p>";
      });
  } else {
    console.log("No token found in localStorage.");
    document.getElementById("orderContainer").innerHTML =
      "<p style='text-align:center;color:gray;'>Please login to see your orders.</p>";
  }
};
// this script for profile testing

    const addressContainer = document.getElementById("selectaddress");
    //const submitBtn = document.getElementById("submitBtn");

    // ✅ Local fake backend response (for testing)
    const data = {
      success: true,
      addresses: [
        { street: "Main Road", city: "Patna", state: "Bihar", zip: "800001" },
        { street: "Sector 18", city: "Delhi", state: "Delhi", zip: "110018" },
        { street: "MG Road", city: "Bangalore", state: "Karnataka", zip: "560001" }
      ]
    };

    // ✅ Simulate fetch delay (for realism)
    setTimeout(() => {
      if (!data.success || !data.addresses || data.addresses.length === 0) {
        addressContainer.innerHTML = "<p>No addresses found.</p>";
        return;
      }

      addressContainer.innerHTML = ""; // clear old content

      // ✅ Loop through each address and create radio button
      data.addresses.forEach((addr, index) => {
        const div = document.createElement("div");
        div.classList.add("address-box");

        div.innerHTML = `
          <label>
            <input type="radio" name="address" value='${JSON.stringify(addr)}' ${index === 0 ? "checked" : ""}>
            ${addr.street}, ${addr.city}, ${addr.state} - ${addr.zip}
          </label>
        `;
        addressContainer.appendChild(div);
      });
    }, 500);

    // ✅ Handle Submit
    // this script to send form data in backend
    document.getElementById("submitbtn").addEventListener("click", async (e) => {
      e.preventDefault();

      const token = localStorage.getItem("token");

      if (!token) {
        alert("Token not found! Please login first.");
        return;
      }

      const addressData = {
        pincode: document.getElementById("pincode").value.trim(),
        landmark: document.getElementById("landmark").value.trim(),
        buildingName: document.getElementById("buildingName").value.trim(),
        colonyName: document.getElementById("colonyName").value.trim(),
        addressText: document.getElementById("addressText").value.trim(),
      };

      try {
        const response = await fetch("http://localhost:3000/addaddress", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(addressData)
        });

        if (!response.ok) {
          throw new Error("Failed to send data to backend");
        }

        const result = await response.json();
        console.log("✅ Server Response:", result);
        alert("Address submitted successfully!");

        // Optional: Reset form after submit
        document.getElementById("addressForm").reset();

      } catch (error) {
        console.error("❌ Error:", error);
        alert("Something went wrong. Please try again!");
      }
    });

// this script is for set selected address in deliveryAddress of mongodb schema 
document.getElementById("Selectaddress").addEventListener("click", async () => {
      // Get selected radio button
      const selectedRadio = document.querySelector('input[name="option"]:checked');

      if (!selectedRadio) {
        alert("Please select one option before submitting!");
        return;
      }

      // Get selected value
      const selectedValue = selectedRadio.value;

      // Prepare data to send
      const data = { selectedOption: selectedValue };
        const token = localStorage.getItem("token");

      try {
        const response = await fetch("http://localhost:3000/setaddress", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
             "Authorization": `Bearer ${token}`
          
          },
          body: JSON.stringify(data)
        });

        const result = await response.json();
        console.log("Server response:", result);

        alert(result.message || "Data sent successfully!");
      } catch (error) {
        console.error("Error sending data:", error);
        alert("Failed to send data to server.");
      }
    });    

    // integrate Razorpay payment in your web application 
    const token = localStorage.getItem("userToken"); // JWT stored at login

    document.getElementById("pay").addEventListener("click", async () => {
      const amount = document.getElementById("amountInput").value;

      if (!amount || amount <= 0) {
        alert("Please enter a valid amount");
        return;
      }
      
      // Create Razorpay order on backend
      const orderRes = await fetch("http://localhost:3000/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify( {amount }),
      });

      const orderData = await orderRes.json();

      if (!orderData.id) {
        alert("Error creating order");
        return;
      }

      const options = {
        key: process.env.RAZORPAY_KEY_ID, // Replace with your Razorpay key ID
        amount: orderData.amount,
        currency: "INR",
        name: "My App Wallet",
        description: "Add money to wallet",
        order_id: orderData.id,
        handler: async function (response) {
          // Verify payment on backend
          const verifyRes = await fetch("http://localhost:3000/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(response),
          });

          const verifyData = await verifyRes.json();

          if (verifyData.success) {
            alert("Payment successful and wallet updated!");
            document.getElementById("balance").innerText = verifyData.newBalance;
          } else {
            alert("Payment verification failed!");
          }
        },
        prefill: {
          name: "User Name",
          email: "user@example.com",
          contact: "9999999999",
        },
        theme: {
          color: "#3399cc",
        },
      };

      const rzp = new Razorpay(options);
      rzp.open();
    });