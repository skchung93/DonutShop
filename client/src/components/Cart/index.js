import React, { useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useLazyQuery } from '@apollo/client';
import { QUERY_CHECKOUT } from '../../utils/queries';
import { idbPromise } from '../../utils/helpers';
import CartItem from '../CartItem';
import Auth from '../../utils/auth';
import { useStoreContext } from '../../utils/GlobalState';
import { TOGGLE_CART, ADD_MULTIPLE_TO_CART } from '../../utils/actions';
import './style.css';

const stripePromise = loadStripe('pk_test_TYooMQauvdEDq54NiTphI7jx');

const Cart = () => {
  const [state, dispatch] = useStoreContext();
  const [getCheckout, { data }] = useLazyQuery(QUERY_CHECKOUT);

  useEffect(() => {
    if (data) {
      stripePromise.then((res) => {
        res.redirectToCheckout({ sessionId: data.checkout.session });
      });
    }
  }, [data]);

  useEffect(() => {
    async function getCart() {
      const cart = await idbPromise('cart', 'get');
      dispatch({ type: ADD_MULTIPLE_TO_CART, products: [...cart] });
    }

    if (!state.cart.length) {
      getCart();
    }
  }, [state.cart.length, dispatch]);

  function toggleCart() {
    dispatch({ type: TOGGLE_CART });
  }

  function calculateTotal() {
    let sum = 0;
    state.cart.forEach((item) => {
      sum += item.price * item.purchaseQuantity;
    });
    return sum.toFixed(2);
  }

  function submitCheckout() {
    const productIds = [];

    state.cart.forEach((item) => {
      for (let i = 0; i < item.purchaseQuantity; i++) {
        productIds.push(item._id);
      }
    });

    getCheckout({
      variables: { products: productIds },
    });
  }

  if (!state.cartOpen) {
    return (
      <div className="cart-closed" onClick={toggleCart}>
        <span role="img" aria-label="trash" >
        <img src="https://img.icons8.com/external-sketchy-juicy-fish/64/000000/external-baked-baking-sketchy-sketchy-juicy-fish-25.png" alt="donut box"/>
        </span>
      </div>
    );
  }

  return (
    <div className="cart my-5 mx-5">
      <div className="close has-text-danger has-text-weight-bold" onClick={toggleCart}>
        ❌
      </div>
      <h2 className="has-text-weight-bold has-text-centered">
        🍩Your Picks🍩
      </h2>
      {state.cart.length ? (
        <div>
          {state.cart.map((item) => (
            <CartItem key={item._id} item={item} />
          ))}

          <div className="has-text-weight-bold has-text-centered">
          <strong>Total: ${calculateTotal()}</strong>
          </div>

            {Auth.loggedIn() ? (
              <div className="buttons is-centered">
              <button className="button is-primary mt-3" onClick={submitCheckout}>
                Checkout
              </button>
              </div>
            ) : (
              <span>(Log in to check out)</span>
            )}
          </div>
      ) : (
        <h3>
          <span role="img" aria-label="shocked">
            🍩
          </span>
          Please Select Some Donuts
        </h3>
      )}
    </div>
  );
};

export default Cart;
