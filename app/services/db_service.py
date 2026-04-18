from statistics import quantiles

from fastapi import HTTPException

from app.core.database import SqlDatabase
from app.core.config import settings
from financial_portfolio_management_bkp.app.schemas.schemas import TransactionCreate, TransactionSide, \
    PortfolioHoldingOut, PositionOut
from financial_portfolio_management_bkp.app.workers.price_worker import PRICE_CACHE


class portfolio_db_service(SqlDatabase):

    def __init__(self):
        super().__init__(db_path=settings.sqlite_path)

    def get_stocks_symbols(self):
        query = "select symbols from stocks"
        output = self.fetch_all(query)
        return output

    def update_price_details(self, sym, price):
        query = "update price_history set price=%s where symbol=%s"
        output = self.fetch_one(query, (sym, price))
        return output

    def list_stock(self):
        query  = "select symbol, name, secotor, industry from stocks "
        output = self.fetch_all(query)
        return output

    def create_transactions(self, txn: TransactionCreate):
        user_id = txn.user_id,
        symbol = txn.symbol,
        quantity = txn.quantity,
        price = txn.price,
        type = txn.type.value,

        query = "insert into transactions (user_id, symbol, quantity, price, type) values (%s, %s, %s, %s)"
        output = self.execute(query, (user_id, symbol, quantity, price, type))
        # return output
        query = "select * from positions where user_id=%s and symbol=%s"
        pos = self.fetch_all(query, (user_id, symbol))

        if type == TransactionSide.buy.value:
            if pos:
                query = "insert into possitions (user_id, symbol, quantity, avg_price) values (%s, %s, %s, %s)"
                output = self.execute(query, (user_id, symbol, quantity, price))
            else:
                pos.quantity += quantity
                total = pos.quantity * pos.avg_price + quantity * price
                pos.avg_price = total / pos.quantity
                query = "update into positions set quantity=%s, avg_price=%s where symbol=%s and user_id=%s"
                output = self.execute(query, (pos.quantity, pos.avg_price, symbol, user_id))
        else:
            if pos.quantity < quantity:
                raise HTTPException(status_code=400, detail="Insufficient holdings for this sale")

            pos.quantity -= quantity
            if pos.quantity==0:
                query = "delete from positions where symbol=%s and user_id=%s"
                self.execute(query, (symbol, user_id))
                return
            query = "update positions set quantity=%s where symbol=%s and user_id=%s"
            self.execute(query, (pos.quantity, symbol, user_id))


    def get_user_trx(self, user_id: int):
        query = "select symbol, quantity, price, type from transactions where user_id=%s"
        output = self.execute(query, (user_id))
        return output

    def get_portfolio_summary(self, user_id: int):
        query = "select * from positions where user_id=%s"
        pos = self.execute(query, (user_id))
        holdings: list[PortfolioHoldingOut] = []

        for p in pos:
            last_price = PRICE_CACHE[p.symbol]

            invested = p.avg_price * p.quantity
            current = p.quanity * last_price

            unrealized_pnl = current - invested
            unrealized_return_pct = ((unrealized_pnl / invested) * 100.0 if invested > 0 else None),

            holdings.append(
                PortfolioHoldingOut(
                    symbol=p.symbol,
                    quantity=p.quantity,
                    avg_price=p.avg_price,
                    last_price=last_price,
                    invested_value=invested,
                    current_value=current,
                    unrealized_pnl=unrealized_pnl,
                    unrealized_return_pct=unrealized_return_pct,
                )
            )

        return holdings


    def get_user_positions(self, user_id):

        query = "select * from positions where user_id=%s"
        pos = self.execute(query, (user_id))
        positions: PositionOut = []
        for p in pos:
            last_price = PRICE_CACHE[p.symbol]
            positions.append(
                PositionOut(
                symbol=p.symbol,
                quantiles=p.quantity,
                avg_price=p.avg_price,
                last_price=last_price
            )
            )
        return positions


















