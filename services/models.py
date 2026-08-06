"""SQLAlchemy models mirroring Prisma tables (do not recreate schema here)."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


ChamberEnum = Enum("senate", "house", name="Chamber", create_type=False)


class Member(Base):
    __tablename__ = "members"

    bioguide_id: Mapped[str] = mapped_column(String, primary_key=True)
    fec_candidate_id: Mapped[str | None] = mapped_column(String, nullable=True)
    first_name: Mapped[str] = mapped_column(String, nullable=False)
    last_name: Mapped[str] = mapped_column(String, nullable=False)
    chamber: Mapped[str] = mapped_column(ChamberEnum, nullable=False)
    party: Mapped[str | None] = mapped_column(String, nullable=True)
    state: Mapped[str] = mapped_column(String, nullable=False)
    district: Mapped[int | None] = mapped_column(Integer, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    filings: Mapped[list["PtrFiling"]] = relationship(back_populates="member")
    disclosures: Mapped[list["AnnualDisclosure"]] = relationship(back_populates="member")
    snapshot: Mapped["PortfolioSnapshot | None"] = relationship(
        back_populates="member", uselist=False
    )


class PtrFiling(Base):
    __tablename__ = "ptr_filings"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    bioguide_id: Mapped[str] = mapped_column(
        String, ForeignKey("members.bioguide_id"), nullable=False
    )
    chamber: Mapped[str] = mapped_column(ChamberEnum, nullable=False)
    filing_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    source_url: Mapped[str] = mapped_column(String, nullable=False)
    raw_file_ref: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    member: Mapped["Member"] = relationship(back_populates="filings")
    transactions: Mapped[list["PtrTransaction"]] = relationship(back_populates="filing")


class PtrTransaction(Base):
    __tablename__ = "ptr_transactions"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    filing_id: Mapped[str] = mapped_column(
        String, ForeignKey("ptr_filings.id"), nullable=False
    )
    ticker: Mapped[str | None] = mapped_column(String, nullable=True)
    asset_desc: Mapped[str] = mapped_column(String, nullable=False)
    asset_type: Mapped[str | None] = mapped_column(String, nullable=True)
    tx_type: Mapped[str] = mapped_column(String, nullable=False)
    buy_sell: Mapped[str | None] = mapped_column(String, nullable=True)
    amount_low: Mapped[int | None] = mapped_column(Integer, nullable=True)
    amount_high: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tx_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    owner: Mapped[str | None] = mapped_column(String, nullable=True)
    comment: Mapped[str | None] = mapped_column(String, nullable=True)
    source: Mapped[str | None] = mapped_column(String, nullable=True)
    fingerprint: Mapped[str | None] = mapped_column(String, unique=True, nullable=True)

    filing: Mapped["PtrFiling"] = relationship(back_populates="transactions")


class AnnualDisclosure(Base):
    __tablename__ = "annual_disclosures"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    bioguide_id: Mapped[str] = mapped_column(
        String, ForeignKey("members.bioguide_id"), nullable=False
    )
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    filing_type: Mapped[str] = mapped_column(String, nullable=False)
    source_url: Mapped[str] = mapped_column(String, nullable=False)
    raw_file_ref: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    member: Mapped["Member"] = relationship(back_populates="disclosures")
    assets: Mapped[list["AssetLine"]] = relationship(back_populates="disclosure")


class AssetLine(Base):
    __tablename__ = "asset_lines"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    disclosure_id: Mapped[str] = mapped_column(
        String, ForeignKey("annual_disclosures.id"), nullable=False
    )
    description: Mapped[str] = mapped_column(String, nullable=False)
    value_low: Mapped[int | None] = mapped_column(Integer, nullable=True)
    value_high: Mapped[int | None] = mapped_column(Integer, nullable=True)
    income_type: Mapped[str | None] = mapped_column(String, nullable=True)

    disclosure: Mapped["AnnualDisclosure"] = relationship(back_populates="assets")


class GovernmentContract(Base):
    __tablename__ = "government_contracts"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    ticker: Mapped[str] = mapped_column(String, nullable=False)
    vendor: Mapped[str] = mapped_column(String, nullable=False)
    agency: Mapped[str | None] = mapped_column(String, nullable=True)
    award_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    amount: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str | None] = mapped_column(String, nullable=True)
    source: Mapped[str] = mapped_column(String, nullable=False, default="contracts-recent")
    fingerprint: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)


class PortfolioSnapshot(Base):
    __tablename__ = "portfolio_snapshots"
    __table_args__ = (UniqueConstraint("bioguide_id"),)

    id: Mapped[str] = mapped_column(String, primary_key=True)
    bioguide_id: Mapped[str] = mapped_column(
        String, ForeignKey("members.bioguide_id"), nullable=False
    )
    estimated_portfolio_usd: Mapped[float | None] = mapped_column(Float, nullable=True)
    trade_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    first_trade_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_trade_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    top_holdings_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    computed_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    member: Mapped["Member"] = relationship(back_populates="snapshot")


# Touch BigInteger so import stays available for future FEC work
_ = BigInteger
