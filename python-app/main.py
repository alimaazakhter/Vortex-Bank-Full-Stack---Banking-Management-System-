from Bank import Bank

bank = Bank()

while True:
    try:
        print("\n--- BANK MENU ---")
        print("1. Create Account")
        print("2. Deposit Money")
        print("3. Withdraw Money")
        print("4. Show Details")
        print("5. Update Details")
        print("6. Delete Account")
        print("7. Exit")

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
            print("Thank you for using Bank System 🙏")
            break

        else:
            print("Invalid choice, try again")

    except ValueError:
        print("❌ Please enter numbers only")
