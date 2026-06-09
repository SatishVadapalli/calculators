/**
 * AlphaNifty Investment Calculators - Mathematics Engine
 */

window.Calculators = {
    /**
     * Calculates SIP with annual step-up.
     * Compounds monthly. Step-up is applied annually (at the start of month 13, 25, 37, etc.).
     * 
     * @param {number} monthlyInvestment Starting monthly investment amount
     * @param {number} expectedReturn Annual return rate in percent (e.g., 12)
     * @param {number} years Investment period in years
     * @param {number} stepUpPercent Annual step-up percentage (e.g., 10 for 10% increase every year)
     * @param {number} stepUpFixed Annual step-up fixed amount (e.g., 1000 for ₹1000 increase every year)
     * @returns {Object} Object containing summary metrics and year-by-year breakdown
     */
    calculateSIP(monthlyInvestment, expectedReturn, years, stepUpPercent = 0, stepUpFixed = 0) {
        const monthlyRate = expectedReturn / 12 / 100;
        const totalMonths = years * 12;
        
        let balance = 0;
        let totalInvested = 0;
        let currentMonthlyInvestment = monthlyInvestment;
        
        const yearlyBreakdown = [];
        let yearlyInvestedThisYear = 0;
        let yearlyInterestThisYear = 0;
        
        for (let month = 1; month <= totalMonths; month++) {
            // Apply annual step-up at the start of each year (except the first year)
            // Month 13 (Year 2), Month 25 (Year 3), etc.
            if (month > 1 && (month - 1) % 12 === 0) {
                if (stepUpPercent > 0) {
                    currentMonthlyInvestment = currentMonthlyInvestment * (1 + stepUpPercent / 100);
                } else if (stepUpFixed > 0) {
                    currentMonthlyInvestment = currentMonthlyInvestment + stepUpFixed;
                }
            }
            
            const startingBalance = balance;
            // Add monthly investment at start of the month
            const investedThisMonth = currentMonthlyInvestment;
            totalInvested += investedThisMonth;
            yearlyInvestedThisYear += investedThisMonth;
            
            // Interest earned at the end of the month
            const interestThisMonth = (startingBalance + investedThisMonth) * monthlyRate;
            balance = startingBalance + investedThisMonth + interestThisMonth;
            yearlyInterestThisYear += interestThisMonth;
            
            // Record breakdown at the end of each year
            if (month % 12 === 0) {
                const yearNum = month / 12;
                yearlyBreakdown.push({
                    year: yearNum,
                    monthlyInvestment: Math.round(currentMonthlyInvestment),
                    investedThisYear: Math.round(yearlyInvestedThisYear),
                    cumulativeInvested: Math.round(totalInvested),
                    interestEarnedThisYear: Math.round(yearlyInterestThisYear),
                    cumulativeInterest: Math.round(balance - totalInvested),
                    closingBalance: Math.round(balance)
                });
                // Reset yearly accumulator variables
                yearlyInvestedThisYear = 0;
                yearlyInterestThisYear = 0;
            }
        }
        
        const totalValue = balance;
        const wealthGained = totalValue - totalInvested;
        
        return {
            summary: {
                totalInvested: Math.round(totalInvested),
                wealthGained: Math.max(0, Math.round(wealthGained)),
                totalValue: Math.round(totalValue)
            },
            breakdown: yearlyBreakdown
        };
    },

    /**
     * Calculates SWP (Systematic Withdrawal Plan) with annual inflation.
     * Compounds monthly. Withdrawal increases annually by the inflation rate.
     * 
     * @param {number} totalInvestment Initial lumpsum investment (principal)
     * @param {number} monthlyWithdrawal Starting monthly withdrawal amount
     * @param {number} expectedReturn Annual return rate in percent (e.g., 8)
     * @param {number} inflationRate Annual inflation rate in percent (e.g., 6)
     * @param {number} years Time period in years
     * @returns {Object} Object containing summary metrics, year-by-year breakdown, and zero-balance info
     */
    calculateSWP(totalInvestment, monthlyWithdrawal, expectedReturn, inflationRate = 0, years) {
        const monthlyRate = expectedReturn / 12 / 100;
        const totalMonths = years * 12;
        
        let balance = totalInvestment;
        let totalWithdrawn = 0;
        let currentMonthlyWithdrawal = monthlyWithdrawal;
        
        const yearlyBreakdown = [];
        let yearlyWithdrawnThisYear = 0;
        let yearlyInterestThisYear = 0;
        let ranOutInMonth = null;
        let ranOutInYear = null;
        
        for (let month = 1; month <= totalMonths; month++) {
            // Apply inflation step-up on the withdrawal at the start of each year (except Year 1)
            if (month > 1 && (month - 1) % 12 === 0 && inflationRate > 0) {
                currentMonthlyWithdrawal = currentMonthlyWithdrawal * (1 + inflationRate / 100);
            }
            
            if (balance <= 0) {
                if (ranOutInMonth === null) {
                    ranOutInMonth = month;
                    ranOutInYear = Math.ceil(month / 12);
                }
                balance = 0;
                // Still add to breakdown if we are within the year
                if (month % 12 === 0) {
                    yearlyBreakdown.push({
                        year: month / 12,
                        monthlyWithdrawal: Math.round(currentMonthlyWithdrawal),
                        withdrawnThisYear: Math.round(yearlyWithdrawnThisYear),
                        cumulativeWithdrawn: Math.round(totalWithdrawn),
                        interestEarnedThisYear: Math.round(yearlyInterestThisYear),
                        closingBalance: 0
                    });
                    yearlyWithdrawnThisYear = 0;
                    yearlyInterestThisYear = 0;
                }
                continue;
            }
            
            const startingBalance = balance;
            // SWP withdrawal happens at the beginning of the month (standard)
            // If balance is less than withdrawal, withdraw whatever is left
            const withdrawalThisMonth = Math.min(balance, currentMonthlyWithdrawal);
            totalWithdrawn += withdrawalThisMonth;
            yearlyWithdrawnThisYear += withdrawalThisMonth;
            
            const postWithdrawalBalance = startingBalance - withdrawalThisMonth;
            
            // Interest earned on remaining balance at the end of the month
            const interestThisMonth = postWithdrawalBalance > 0 ? postWithdrawalBalance * monthlyRate : 0;
            balance = postWithdrawalBalance + interestThisMonth;
            yearlyInterestThisYear += interestThisMonth;
            
            // Record breakdown at the end of each year
            if (month % 12 === 0) {
                yearlyBreakdown.push({
                    year: month / 12,
                    monthlyWithdrawal: Math.round(currentMonthlyWithdrawal),
                    withdrawnThisYear: Math.round(yearlyWithdrawnThisYear),
                    cumulativeWithdrawn: Math.round(totalWithdrawn),
                    interestEarnedThisYear: Math.round(yearlyInterestThisYear),
                    closingBalance: Math.round(balance)
                });
                // Reset yearly accumulator variables
                yearlyWithdrawnThisYear = 0;
                yearlyInterestThisYear = 0;
            }
        }
        
        // Handle final year breakdown if total months is not a multiple of 12 (though standard input restricts to integer years)
        const totalValue = balance;
        
        return {
            summary: {
                totalInvestment: Math.round(totalInvestment),
                totalWithdrawn: Math.round(totalWithdrawn),
                closingBalance: Math.round(totalValue),
                ranOut: ranOutInMonth !== null,
                ranOutYear: ranOutInYear,
                ranOutMonth: ranOutInMonth
            },
            breakdown: yearlyBreakdown
        };
    },

    /**
     * Calculates Lumpsum Investment.
     * Compounds annually (standard CAGR model).
     * 
     * @param {number} totalInvestment Initial investment amount
     * @param {number} expectedReturn Annual return rate in percent (e.g., 12)
     * @param {number} years Investment period in years
     * @returns {Object} Object containing summary metrics and year-by-year breakdown
     */
    calculateLumpsum(totalInvestment, expectedReturn, years) {
        const rate = expectedReturn / 100;
        
        let balance = totalInvestment;
        const yearlyBreakdown = [];
        let cumulativeInterest = 0;
        
        for (let year = 1; year <= years; year++) {
            const startingBalance = balance;
            const interestEarned = startingBalance * rate;
            balance = startingBalance + interestEarned;
            cumulativeInterest += interestEarned;
            
            yearlyBreakdown.push({
                year: year,
                investedThisYear: year === 1 ? totalInvestment : 0,
                cumulativeInvested: totalInvestment,
                interestEarnedThisYear: Math.round(interestEarned),
                cumulativeInterest: Math.round(cumulativeInterest),
                closingBalance: Math.round(balance)
            });
        }
        
        const totalValue = balance;
        const wealthGained = totalValue - totalInvestment;
        
        return {
            summary: {
                totalInvested: Math.round(totalInvestment),
                wealthGained: Math.round(wealthGained),
                totalValue: Math.round(totalValue)
            },
            breakdown: yearlyBreakdown
        };
    }
};
