import streamlit as st
from Bank import Bank

st.set_page_config(page_title="Bank App", layout="centered")
st.title("🏦 Bank Management System")

menu = st.sidebar.selectbox(
    "Menu",
    ["Create Account", "Deposit", "Withdraw", "Check Balance"]
)

# -------- CREATE ACCOUNT --------
if menu == "Create Account":
    name = st.text_input("Name")
    age = st.number_input("Age", min_value=18)
    email = st.text_input("Email")
    pin = st.text_input("4-digit PIN", type="password")

    if st.button("Create"):
        user, msg = Bank.create_account_ui(name, age, email, int(pin))

        if user:
            st.success(msg)
            st.info(f"Account Number: {user['accountNo']}")
        else:
            st.error(msg)

# -------- DEPOSIT --------
elif menu == "Deposit":
    acc = st.text_input("Account Number")
    pin = st.text_input("PIN", type="password")
    amt = st.number_input("Amount", min_value=1)

    if st.button("Deposit"):
        if Bank.deposit_ui(acc, int(pin), int(amt)):
            st.success("Amount deposited successfully")
        else:
            st.error("Invalid account or PIN")

# -------- WITHDRAW --------
elif menu == "Withdraw":
    acc = st.text_input("Account Number")
    pin = st.text_input("PIN", type="password")
    amt = st.number_input("Amount", min_value=1)

    if st.button("Withdraw"):
        if Bank.withdraw_ui(acc, int(pin), int(amt)):
            st.success("Amount withdrawn successfully")
        else:
            st.error("Invalid details or insufficient balance")

# -------- CHECK BALANCE --------
elif menu == "Check Balance":
    acc = st.text_input("Account Number")
    pin = st.text_input("PIN", type="password")

    if st.button("Check"):
        balance = Bank.check_balance_ui(acc, int(pin))
        if balance is not None:
            st.success(f"Current Balance: ₹{balance}")
        else:
            st.error("Invalid account or PIN")
