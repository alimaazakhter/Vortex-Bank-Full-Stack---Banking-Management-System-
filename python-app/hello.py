from abc import ABC, abstractmethod

class AccountInterface(ABC):
    @abstractmethod
    def deposit(self, amount):
        pass

    @abstractmethod
    def withdraw(self, amount):
        pass

    @abstractmethod
    def check_balance(self):
        pass


class BankAccount(AccountInterface):
    total_accounts = 0

    def __init__(self, name, mobile, balance):
        BankAccount.total_accounts += 1
        self.acc_no = BankAccount.total_accounts
        self.name = name
        self.mobile = mobile
        self.__balance = balance

    def deposit(self, amount):
        self.__balance += amount
        print("Amount Deposited Successfully!")

    def withdraw(self, amount):
        if amount <= self.__balance:
            self.__balance -= amount
            print("Amount Withdrawn Successfully!")
        else:
            print("Insufficient Balance!")

    def check_balance(self):
        print("Current Balance:", self.__balance)


accounts = []

while True:
    try:
        print("\n--- BANK MENU ---")
        print("1. Create Account")
        print("2. Deposit")
        print("3. Withdraw")
        print("4. Check Balance")
        print("5. Exit")

        ch = int(input("Enter your choice: "))

        if ch == 1:
            name = input("Enter Name: ")
            mobile = input("Enter Mobile: ")
            bal = int(input("Enter Opening Balance: "))
            acc = BankAccount(name, mobile, bal)
            accounts.append(acc)
            print("Account Created Successfully! Account No:", acc.acc_no)

        elif ch == 2:
            acc_no = int(input("Enter Account No: "))
            amt = int(input("Enter Amount to Deposit: "))
            found = False
            for a in accounts:
                if a.acc_no == acc_no:
                    a.deposit(amt)
                    found = True
            if not found:
                print("Invalid Account Number!")

        elif ch == 3:
            acc_no = int(input("Enter Account No: "))
            amt = int(input("Enter Amount to Withdraw: "))
            found = False
            for a in accounts:
                if a.acc_no == acc_no:
                    a.withdraw(amt)
                    found = True
            if not found:
                print("Invalid Account Number!")

        elif ch == 4:
            acc_no = int(input("Enter Account No: "))
            found = False
            for a in accounts:
                if a.acc_no == acc_no:
                    a.check_balance()
                    found = True
            if not found:
                print("Invalid Account Number!")

        elif ch == 5:
            print("Thank You for Using Bank System 🙏")
            break

        else:
            print("Invalid Choice! Enter between 1-5 only.")

    except ValueError:
        print("❌ Please enter numbers only!")
    except Exception as e:
        print("❌ Error Occurred:", e)
