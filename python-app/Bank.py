import json
import random
import string
from pathlib import Path
from abc import ABC, abstractmethod


# -------- Interface --------
class BankInterface(ABC):

    @abstractmethod
    def create_account(self):
        pass

    @abstractmethod
    def deposit_money(self):
        pass

    @abstractmethod
    def withdraw_money(self):
        pass

    @abstractmethod
    def show_details(self):
        pass

    @abstractmethod
    def update_details(self):
        pass

    @abstractmethod
    def delete_account(self):
        pass


# -------- Bank Class --------
class Bank(BankInterface):

    database = "data.json"
    data = []

    @classmethod
    def create_account_ui(cls, name, age, email, pin):
        if age < 18 or len(str(pin)) != 4:
            return None, "Age must be 18+ and PIN must be 4 digits"

        user = {
            "name": name,
            "age": age,
            "email": email,
            "pin": pin,
            "accountNo": cls.generate_account_no(),
            "balance": 0
        }

        cls.data.append(user)
        cls.save_data()
        return user, "Account created successfully"

    @classmethod
    def deposit_ui(cls, acc_no, pin, amount):
        for u in cls.data:
            if u["accountNo"] == acc_no and u["pin"] == pin:
                if amount <= 0 or amount > 10000:
                    return False
                u["balance"] += amount
                cls.save_data()
                return True
        return False

    @classmethod
    def withdraw_ui(cls, acc_no, pin, amount):
        for u in cls.data:
            if u["accountNo"] == acc_no and u["pin"] == pin:
                if u["balance"] >= amount:
                    u["balance"] -= amount
                    cls.save_data()
                    return True
                return False
        return False

    @classmethod
    def check_balance_ui(cls, acc_no, pin):
        for u in cls.data:
            if u["accountNo"] == acc_no and u["pin"] == pin:
                return u["balance"]
        return None


    # -------- Load data --------
    if Path(database).exists():
        try:
            with open(database, "r") as file:
                data = json.load(file)
        except:
            data = []
    else:
        data = []

    # -------- Save data --------
    @classmethod
    def save_data(cls):
        with open(cls.database, "w") as file:
            json.dump(cls.data, file, indent=4)

    # -------- Generate account number --------
    @staticmethod
    def generate_account_no():
        letters = random.choices(string.ascii_letters, k=3)
        digits = random.choices(string.digits, k=3)
        symbol = random.choice("!@#$")
        acc = letters + digits + [symbol]
        random.shuffle(acc)
        return "".join(acc)

    # ================= CLI METHODS =================

    def create_account(self):
        try:
            name = input("Enter your name: ")
            age = int(input("Enter your age: "))
            email = input("Enter your email: ")
            pin = int(input("Set 4 digit PIN: "))

            if age < 18 or len(str(pin)) != 4:
                print("Age must be 18+ and PIN must be 4 digits")
                return

            user = {
                "name": name,
                "age": age,
                "email": email,
                "pin": pin,
                "accountNo": self.generate_account_no(),
                "balance": 0
            }

            self.data.append(user)
            self.save_data()

            print("\nAccount created successfully!")
            print("Your Account Number:", user["accountNo"])

        except ValueError:
            print("Invalid input")

    def deposit_money(self):
        acc = input("Enter account number: ")
        pin = int(input("Enter PIN: "))
        amount = int(input("Enter amount: "))

        for u in self.data:
            if u["accountNo"] == acc and u["pin"] == pin:
                if amount <= 0 or amount > 10000:
                    print("Amount must be between 1 and 10000")
                    return
                u["balance"] += amount
                self.save_data()
                print("Amount deposited successfully")
                return

        print("Invalid account number or PIN")

    def withdraw_money(self):
        acc = input("Enter account number: ")
        pin = int(input("Enter PIN: "))
        amount = int(input("Enter amount: "))

        for u in self.data:
            if u["accountNo"] == acc and u["pin"] == pin:
                if u["balance"] >= amount:
                    u["balance"] -= amount
                    self.save_data()
                    print("Amount withdrawn successfully")
                else:
                    print("Insufficient balance")
                return

        print("Invalid account number or PIN")

    def show_details(self):
        acc = input("Enter account number: ")
        pin = int(input("Enter PIN: "))

        for u in self.data:
            if u["accountNo"] == acc and u["pin"] == pin:
                print("\n--- Account Details ---")
                for k, v in u.items():
                    print(f"{k}: {v}")
                return

        print("Invalid account number or PIN")

    def update_details(self):
        acc = input("Enter account number: ")
        pin = int(input("Enter PIN: "))

        for u in self.data:
            if u["accountNo"] == acc and u["pin"] == pin:
                print("Leave empty to keep old value")

                name = input("New name: ") or u["name"]
                email = input("New email: ") or u["email"]

                u["name"] = name
                u["email"] = email
                self.save_data()

                print("Details updated successfully")
                return

        print("Invalid account number or PIN")

    def delete_account(self):
        acc = input("Enter account number: ")
        pin = int(input("Enter PIN: "))

        for u in self.data:
            if u["accountNo"] == acc and u["pin"] == pin:
                self.data.remove(u)
                self.save_data()
                print("Account deleted successfully")
                return

        print("Invalid account number or PIN")


# ================= CLI RUN =================
if __name__ == "__main__":

    bank = Bank()

    while True:
        print("\n--- BANK MENU ---")
        print("1. Create Account")
        print("2. Deposit Money")
        print("3. Withdraw Money")
        print("4. Show Details")
        print("5. Update Details")
        print("6. Delete Account")
        print("7. Exit")

        try:
            choice = int(input("Enter your choice: "))

            if choice == 1:
                bank.create_account()
            elif choice == 2:
                bank.deposit_money()
            elif choice == 3:
                bank.withdraw_money()
            elif choice == 4:
                bank.show_details()
            elif choice == 5:
                bank.update_details()
            elif choice == 6:
                bank.delete_account()
            elif choice == 7:
                print("Thank you 🙏")
                break
            else:
                print("Invalid choice")

        except ValueError:
            print("Please enter numbers only")
