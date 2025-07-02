import React, { useEffect, useState } from 'react';


import './Checkout.css'
import OrderAPI from '../API/OrderAPI';
import Paypal from './Paypal';
import { useForm } from "react-hook-form";
import { Redirect } from 'react-router-dom';
import { changeCount } from '../Redux/Action/ActionCount';
import { useDispatch, useSelector } from 'react-redux';
import NoteAPI from '../API/NoteAPI';
import Detail_OrderAPI from '../API/Detail_OrderAPI';
import CouponAPI from '../API/CouponAPI';





function Checkout(props) {

    const [orderID, setOrderID] = useState('')

    const [carts, set_carts] = useState([])

    const [total_price, set_total_price] = useState(0)

    const [discount, set_discount] = useState(0)

    // state load_map
    // const [load_map, set_load_map] = useState(true)

    // state load_order
    const [load_order_status, set_load_order_status] = useState(false)

    const [check_action, set_check_action] = useState(false)

    useEffect(() => {
    const cartsData = JSON.parse(localStorage.getItem('carts')) || [];
    set_carts(cartsData);
    console.log("CARTS (init): ", cartsData);
    Sum_Price(cartsData, 0);
}, []);



    useEffect(() => {

        if (check_action) {

            set_carts(JSON.parse(localStorage.getItem('carts')))

            Sum_Price(JSON.parse(localStorage.getItem('carts')), 0)

            set_check_action(false)
        }

    }, [check_action])
            // console.log("cart",carts);

    // Hàm này dùng để tính tổng tiền
    function Sum_Price(carts, sum_price) {


        carts.map(value => {
            return sum_price += Number(value.count) * Number(value.price_product)
        })

        const total = Number(sum_price)

        if (localStorage.getItem('coupon')){
            // GET localStorage
            const coupon = JSON.parse(localStorage.getItem('coupon'))

            set_discount((total * parseInt(coupon.promotion)) / 100)

            const newTotal = total - ((total * parseInt(coupon.promotion)) / 100) + Number(price)

            localStorage.setItem("total_price", newTotal)

            set_total_price(newTotal)
        }else{
            
            localStorage.setItem("total_price", total )

            set_total_price(total)

        }

    }

    const [show_error, set_show_error] = useState(false)

    const [information, set_information] = useState({
        fullname: '',
        phone: '',
        address: '',
        email: ''
    })

    const onChangeFullname = (e) => {
        set_information({
            fullname: e.target.value,
            phone: information.phone,
            address: information.address,
            email: information.email
        })
    }
    const onChangePhone = (e) => {
        set_information({
            fullname: information.fullname,
            phone: e.target.value,
            address: information.address,
            email: information.email
        })
    }

    const onChangeAddress = (e) => {
        set_information({
            fullname: information.fullname,
            phone: information.phone,
            address: e.target.value,
            email: information.email
        })
    }
    const onChangeEmail = (e) => {
        set_information({
            fullname: information.fullname,
            phone: information.phone,
            address: information.address,
            email: e.target.value
        })
    }

    // Hàm này dùng để check validation cho paypal
    useEffect(() => {

        checkValidation()

    }, [information])

    // Kiểm tra Paypal
    function checkValidation() {
        if (information.fullname === '') {
            set_show_error(true)
        } else {
            if (information.phone === '') {
                set_show_error(true)
            } else {
                if (information.email === '') {
                    
                    localStorage.setItem('information', JSON.stringify(information))

                    set_show_error(true)
                } else {
                    set_show_error(false)
                }
            }
        }
    }


    const { register, handleSubmit, errors } = useForm();

    const [redirect, set_redirect] = useState(false)


    const [load_order, set_load_order] = useState(false)

    const count_change = useSelector(state => state.Count.isLoad)

    const dispatch = useDispatch()

    // Hàm này dùng để thanh toán offline
    const handler_Checkout = async (data) => {

        set_load_order(true)

        if (localStorage.getItem("id_coupon")){

            const responseUpdate = await CouponAPI.updateCoupon(localStorage.getItem("id_coupon"))
            console.log(responseUpdate)

        }

        // data Delivery
        const data_delivery = {
            // id_delivery:  Math.random.toString(),
            fullname: information.fullname,
            phone: information.phone,
        }

        // Xứ lý API Delivery
        const response_delivery = await NoteAPI.post_note(data_delivery)

        // data Order
        const data_order = {
            id_user: sessionStorage.getItem('id_user'),
            address: information.address,
            total: total_price,
            status: "1",
            pay: false,
            id_payment: '6086709cdc52ab1ae999e882',
            id_note: response_delivery._id,
            // feeship: price,
            id_coupon: localStorage.getItem('id_coupon') ? localStorage.getItem('id_coupon') : '',
            create_time: `${new Date().getDate()}/${parseInt(new Date().getMonth()) + 1}/${new Date().getFullYear()}`
        }

        // Xứ lý API Order
        const response_order = await OrderAPI.post_order(data_order)

        // data carts
        const data_carts = JSON.parse(localStorage.getItem('carts'))

        // Xử lý API Detail_Order
        for (let i = 0; i < data_carts.length; i++) {

            const data_detail_order = {
                id_order: response_order._id,
                id_product: data_carts[i].id_product,
                name_product: data_carts[i].name_product,
                price_product: data_carts[i].price_product,
                count: data_carts[i].count,
                size: data_carts[i].size
            }

            await Detail_OrderAPI.post_detail_order(data_detail_order)

        }

      

        localStorage.removeItem('information')
        localStorage.removeItem('total_price')
        localStorage.removeItem('price')
        localStorage.removeItem('id_coupon')
        localStorage.removeItem('coupon')
        localStorage.setItem('carts', JSON.stringify([]))

        set_redirect(true)


        // Hàm này dùng để load lại phần header bằng Redux
        const action_count_change = changeCount(count_change)
        dispatch(action_count_change)

    }

    const Change_Load_Order = (value) => {

        set_load_order(value)

    }

    // Giá tiền
    const [price, set_price] = useState(0)


   



    return (
        <div>

            {
                load_order && (
                    <div className="wrapper_loader">
                        <div className="loader"></div>
                    </div>
                )
            }

            <div className="breadcrumb-area">
                <div className="container">
                    <div className="breadcrumb-content">
                        <ul>
                            <li><a href="index.html">Home</a></li>
                            <li className="active">Checkout</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="container" style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
                {
                }
                {
                    true  && (
                        <div className="row">
                            <div className="col-lg-6 col-12 pb-5">
                                <form onSubmit={handleSubmit(handler_Checkout)}>
                                    <div className="checkbox-form">
                                        <h3>Billing Details</h3>
                                        <div className="row">
                                            <div className="col-md-12">
                                                <div className="checkout-form-list">
                                                    <label>Full Name <span className="required">*</span></label>
                                                    <input placeholder="Enter Fullname" type="text" name="fullname"
                                                        ref={register({ required: true })}
                                                        value={information.fullname}
                                                        onChange={onChangeFullname} />
                                                    {errors.fullname && errors.fullname.type === "required" && <span style={{ color: 'red' }}>* Fullname is required</span>}
                                                </div>
                                            </div>
                                            <div className="col-md-12">
                                                <div className="checkout-form-list">
                                                    <label>Phone Number <span className="required">*</span></label>
                                                    <input placeholder="Enter Phone Number" type="text" name="phone"
                                                        ref={register({ required: true })}
                                                        value={information.phone}
                                                        onChange={onChangePhone} />
                                                    {errors.phone && errors.phone.type === "required" && <span style={{ color: 'red' }}>* Phone Number is required</span>}
                                                </div>
                                            </div>
                                            <div className="col-md-12">
                                                <div className="checkout-form-list">
                                                    <label>Address <span className="required">*</span></label>
                                                    <input placeholder="Street address" type="text" name="address"
                                                        ref={register({ required: true })}
                                                        value={information.address}
                                                        onChange={onChangeAddress}
                                                         />
                                                    {errors.address && errors.address.type === "required" && <span style={{ color: 'red' }}>* Address is required</span>}
                                                </div>
                                            </div>
                                            <div className="col-md-12">
                                                <div className="checkout-form-list">
                                                    <label>Email <span className="required">*</span></label>
                                                    <input placeholder="Enter Email" type="email" name="email"
                                                        ref={register({ required: true })}
                                                        value={information.email}
                                                        onChange={onChangeEmail} />
                                                    {errors.email && errors.email.type === "required" && <span style={{ color: 'red' }}>* Email is required</span>}
                                                </div>
                                            </div>
                                            <div className="col-md-12">
                                                <div className="order-button-payment">
                                                    {
                                                        redirect && <Redirect to="/success" />
                                                    }
                                                    <input value="Place order" type="submit" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div className="col-lg-6 col-12">
                                <div className="your-order">
                                    <h3>Your order</h3>
                                    <div className="your-order-table table-responsive">
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th className="cart-product-name">Product</th>
                                                    <th className="cart-product-total">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {
                                                    carts && carts.map(value => (
                                                        <tr className="cart_item" key={value._id}>
                                                            <td className="cart-product-name">{value.name_product}<strong className="product-quantity"> × {value.count}</strong></td>
                                                            <td className="cart-product-total"><span className="amount">{new Intl.NumberFormat('vi-VN',{style: 'decimal',decimal: 'VND'}).format(parseInt(value.price_product) * parseInt(value.count)) + ' VNĐ'}</span></td>
                                                        </tr>
                                                    ))
                                                }
                                            </tbody>
                                            <tfoot>
                                                <tr className="cart-subtotal">
                                                    <th>Shipping Cost</th>
                                                    <td><span className="amount">{new Intl.NumberFormat('vi-VN',{style: 'decimal',decimal: 'VND'}).format(price) + ' VNĐ'}</span></td>
                                                </tr>
                                                <tr className="cart-subtotal">
                                                    <th>Discount</th>
                                                    <td><span className="amount">{new Intl.NumberFormat('vi-VN',{style: 'decimal',decimal: 'VND'}).format(discount) + ' VNĐ'}</span></td>
                                                </tr>
                                                <tr className="order-total">
                                                    <th>Order Total</th>
                                                    <td><strong><span className="amount">{new Intl.NumberFormat('vi-VN',{style: 'decimal',decimal: 'VND'}).format(total_price) + ' VNĐ'}</span></strong></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                    <div className="payment-method">
                                        <div className="payment-accordion">
                                            <div id="accordion">
                                                <div className="card">
                                                    <div className="card-header" id="#payment-3">
                                                        <h5 className="panel-title">
                                                            <a className="collapsed" data-toggle="collapse" data-target="#collapseThree" aria-expanded="false" aria-controls="collapseThree">
                                                                PayPal
                                                </a>
                                                        </h5>
                                                    </div>
                                                    <div id="collapseThree" className="collapse">
                                                        <div className="card-body">
                                                            {
                                                                show_error ? 'Please Checking Information!' :
                                                                    <Paypal
                                                                        information={information}
                                                                        total={total_price}
                                                                        Change_Load_Order={Change_Load_Order}
                                                                        price={price}
                                                                    />
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }
            </div>
        </div>

    );
}

export default Checkout;