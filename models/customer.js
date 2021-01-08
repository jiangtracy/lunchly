'use strict';

/** Customer for Lunchly */

const db = require('../db');
const Reservation = require('./reservation');

/** Customer of the restaurant. */

class Customer {
	constructor({ id, firstName, lastName, phone, notes }) {
		this.id = id;
		this.firstName = firstName;
		this.lastName = lastName;
		this.phone = phone;
		this.notes = notes;
	}

	/** find all customers. */

	static async all() {
		const results = await db.query(
			`SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           ORDER BY last_name, first_name`
		);
		return results.rows.map((c) => new Customer(c));
	}

	/** get a customer by ID. */

	static async get(id) {
		const results = await db.query(
			`SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           WHERE id = $1`,
			[ id ]
		);

		const customer = results.rows[0];

		if (customer === undefined) {
			const err = new Error(`No such customer: ${id}`);
			err.status = 404;
			throw err;
		}

		return new Customer(customer);
	}

	/* Gets a customer by name */
	static async getByName(name) {
		let [ firstName, lastName ] = name.split(' ');
		const results = await db.query(
			`SELECT id,
              first_name AS "firstName",
              last_name  AS "lastName",
              phone,
              notes
       FROM customers
       WHERE first_name ILIKE $1
       OR last_name ILIKE $2 `,
			[ `%${firstName}%`, `%${lastName}%` ]
		);
		let customers = [];
		for (let row of results.rows) {
			customers.push(new Customer(row));
		}
		console.log('Customers: ', customers);

		if (customers === undefined) {
			const err = new Error(`No such customer: ${name}`);
			err.status = 404;
			throw err;
		}

		return customers;
	}
	/* generate a fullname for a customer */

	fullName() {
		return `${this.firstName} ${this.lastName}`;
	}
	/** get all reservations for this customer. */

	async getReservations() {
		return await Reservation.getReservationsForCustomer(this.id);
	}

	/* gereate top 10 customers with highest number of reservations  */

	static async bestCustomers() {
		//grab top 10 customers' ids
		const rResults = await db.query(
			`SELECT customer_id, COUNT(id) 
        FROM reservations 
        GROUP BY customer_id
        ORDER BY COUNT(id) DESC 
        LIMIT 10`
		);
		let bestCustomersIdArray = rResults.rows.map((customer) => Number(customer.customer_id));

		//grab customer name
		const cResults = await db.query(
			`SELECT id,
        first_name AS "firstName",
        last_name  AS "lastName",
        phone,
        notes
        FROM customers
        WHERE id IN ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
			[ ...bestCustomersIdArray ]
		);

		return cResults.rows.map((row) => new Customer(row));
	}

	/** save this customer. */

	async save() {
		if (this.id === undefined) {
			const result = await db.query(
				`INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
				[ this.firstName, this.lastName, this.phone, this.notes ]
			);
			this.id = result.rows[0].id;
		} else {
			await db.query(
				`UPDATE customers
             SET first_name=$1,
                 last_name=$2,
                 phone=$3,
                 notes=$4
             WHERE id = $5`,
				[ this.firstName, this.lastName, this.phone, this.notes, this.id ]
			);
		}
	}
}

module.exports = Customer;
