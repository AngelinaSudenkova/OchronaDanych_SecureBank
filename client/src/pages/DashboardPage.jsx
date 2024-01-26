import React, { useState, useEffect } from 'react';
import httpClient from '../httpClient';
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  CardActions,
  TextField,
  Grid,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Link
} from '@mui/material';

function DashboardPage() {
  const [username, setUsername] = useState('');
  const [balance, setBalance] = useState(0);
  const [recipientCard, setRecipientEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [failed_login_attempts, setFailedAttempts] = useState(0);
  const [cardNumber, setCardNumber] = useState('');
  const [cvv, setCVV] = useState('');
  const [csrf_token, setCsrfToken] = useState(null);

  const getCsrfToken = async () => {
          try {
            const response = await httpClient.get("//localhost/api/csrf-token");
            setCsrfToken(response.data.token)
          } catch (error) {
            return "";
          }
        };
  useEffect(() => {
        getCsrfToken();
      }, []);

  useEffect(() => {
    (async () => {
      try {
        const userResponse = await httpClient.get('//localhost/api/@me');
        setUsername(userResponse.data.username);
        setFailedAttempts(userResponse.data.failed_login_attempts)

        const balanceResponse = await httpClient.get('//localhost/api/balance');
        setBalance(balanceResponse.data.balance);

        const transactionsResponse = await httpClient.get('//localhost/api/transactions');
        setTransactions(transactionsResponse.data.transactions);
        const cardResponse = await httpClient.get('//localhost/api/card');
        setCardNumber(cardResponse.data.card_number);
        setCVV(cardResponse.data.cvv);
      } catch (error) {
        setError('An error occurred while fetching your card information.');
      }
    })();
  }, []);

  const handleSendTransaction = async (event) => {
    event.preventDefault();
    try {
      const response = await httpClient.post('//localhost/api/send_transaction', {
        card: recipientCard,
        amount: amount,
        comment: comment
      }, {
            headers: {
                "X-CSRFToken": csrf_token
            }
        });

      if (response.data.message) {
        alert(response.data.message);
        setRecipientEmail('');
        setAmount('');
        setBalance(response.data.new_balance || balance);
        setComment('');
      } else {
        setError(response.data.error);
      }
    } catch (error) {
      setError('An error occurred while sending the transaction.');
    }
  };

return (

    <Grid container spacing={2} alignItems="center">
      <Grid item xs={12}>
        <Card>
              <a href="/settings" ><button>Manage settings</button></a>
              <Typography variant="h5">Failed attempts since last login: {failed_login_attempts}</Typography>
             <CardContent>
            <Typography variant="h4" color="textPrimary">
              Payment dashboard
              <br />
            </Typography>
            {error && <Typography color="error">{error}</Typography>}
            <Typography variant="h5">Your Balance: {balance}</Typography>
          </CardContent>
          <CardActions>
            <form onSubmit={handleSendTransaction}>
              <TextField
                label="Recipient Card"
                value={recipientCard}
                onChange={(e) => setRecipientEmail(e.target.value)}
                margin="normal"
                fullWidth
              />
              <TextField
                label="Amount"
                type="number"
                value={amount}
                onChange={(e) => {
                  const newValue = parseFloat(e.target.value) || 0;
                  if (newValue > 0) {
                    setAmount(newValue);
                  }
                }}
                margin="normal"
                fullWidth
              />
              <TextField
                label="Comment"
                type="textarea"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                margin="normal"
                fullWidth
              />
              <Button type="submit" variant="contained" color="primary">
                Send Money
              </Button>
            </form>
           </CardActions>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h5" color="textPrimary">
              Recent Transactions
            </Typography>
            <Table>
              <TableBody>
                {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                        <TableCell>{transaction.type}</TableCell>
                        <TableCell>{transaction.amount}</TableCell>
                        <TableCell>{transaction.comment}</TableCell>
                        <TableCell>{transaction.timestamp}</TableCell>
                     </TableRow>))}
                    </TableBody>
                    </Table>
                              </CardContent>
                            </Card>
                          </Grid>
                        </Grid>
                      );
                    } 

export default DashboardPage;