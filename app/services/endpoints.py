from financial_portfolio_management.app.services.db_service import portfolio_db_service
from fastapi import Depends

from financial_portfolio_management_bkp.app.schemas.schemas import TransactionCreate


class PortfolioEndpoints:

    def list_stock(self):
        service = portfolio_db_service()
        result = service.list_stock()
        return result

    def transactions(self, trx: TransactionCreate):
        service = portfolio_db_service()
        result = service.create_transactions(trx)
        return result

    def get_user_trasactions_details(self, user_id: int):
        service = portfolio_db_service()
        result = service.get_user_trx(user_id)

        # /// format output
        return result

    def get_user_positions(self, user_id):
        service = portfolio_db_service()
        positions = service.get_user_positions(user_id)
        return positions

    def get_portfolio_summary(self, user_id: int):
        service = portfolio_db_service()
        holding = service.get_portfolio_summary(user_id)
        return holding
