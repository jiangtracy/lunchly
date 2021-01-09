'use strict';

const { isDate } = require('moment');
/** Reservation for Lunchly */

const moment = require('moment');
const validator = require('validator');
const db = require('../db');

/** A reservation for a party */

class Reservation {
	constructor({ id, customerId, numGuests, startAt, notes }) {
		this.id = id;
		this.customerId = customerId;
		this._numGuests = numGuests;
		this.startAt = startAt;
		this.notes = notes;
	}

  /* numGuests getter */
  get numGuests(){
    return this._numGuests;
  }

	/* numGuests setter, validates number */
	set numGuests(numGuests) {
		if (numGuests > 0) this._numGuests = numGuests;
		else throw new Error("Must have more than 0 guests.");
  }
  

  // set startAt(startAt){
  //   if (isDate(startAt)) this._startAt = startAt;
	// 	else throw new Error("Must be a valid date");
  // }

	/** formatter for startAt */

	getFormattedStartAt() {
		return moment(this.startAt).format('MMMM Do YYYY, h:mm a');
	}

	/** given a customer id, find their reservations. */

	static async getReservationsForCustomer(customerId) {
		const results = await db.query(
			`SELECT id,
                  customer_id AS "customerId",
                  num_guests AS "numGuests",
                  start_at AS "startAt",
                  notes AS "notes"
           FROM reservations
           WHERE customer_id = $1`,
			[customerId]
		);

		return results.rows.map((row) => new Reservation(row));
	}

	/* create or update a reservation */

	async save() {
		if (this.id === undefined) {
			const result = await db.query(
				`INSERT INTO reservations (
              customer_id,
              num_guests,
              start_at,
              notes)
            VALUES ($1, $2, $3, $4)
            RETURNING id`,
				[this.customerId, this.numGuests, this.startAt, this.notes]
			);
			this.id = result.rows[0].id;
		} else {
			await db.query(
				`UPDATE reservations
              SET customer_id=$1,
                 num_guests=$2,
                 start_at=$3,
                 notes=$4
              WHERE id = $5`,
				[this.customerId, this.numGuests, this.startAt, this.notes, this.id]
			);
		}
	}
}

module.exports = Reservation;
