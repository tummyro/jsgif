/*
 * NeuQuant Neural-Net Quantization Algorithm
 * ------------------------------------------
 *
 * Copyright (c) 1994 Anthony Dekker
 *
 * NEUQUANT Neural-Net quantization algorithm by Anthony Dekker, 1994. See
 * "Kohonen neural networks for optimal colour quantization" in "Network:
 * Computation in Neural Systems" Vol. 5 (1994) pp 351-367. for a discussion of
 * the algorithm.
 *
 * Any party obtaining a copy of these files from the author, directly or
 * indirectly, is granted, free of charge, a full and unrestricted irrevocable,
 * world-wide, paid up, royalty-free, nonexclusive right and license to deal in
 * this software and documentation files (the "Software"), including without
 * limitation the rights to use, copy, modify, merge, publish, distribute,
 * sublicense, and/or sell copies of the Software, and to permit persons who
 * receive copies from any such party to do so, with the only requirement being
 * that this copyright notice remain intact.
 */

/*
 * This class handles Neural-Net quantization algorithm
 * @author Kevin Weiner (original Java version - kweiner@fmsware.com)
 * @author Thibault Imbert (AS3 version - bytearray.org)
 * @author Kevin Kwok (JavaScript version - https://github.com/antimatter15/jsgif)
 * @version 0.1 AS3 implementation
 */

class NeuQuant {
	constructor() {
	
	this.exports = {};
	this.netsize = 256; /* number of colours used */

	/* four primes near 500 - assume no image has a length so large */
	/* that it is divisible by all four primes */

	this.prime1 = 499;
	this.prime2 = 491;
	this.prime3 = 487;
	this.prime4 = 503;
	this.minpicturebytes = (3 * this.prime4); /* minimum size for input image */

	/*
	 * Program Skeleton ---------------- [select samplefac in range 1..30] [read
	 * image from input file] pic = (unsigned char*) malloc(3*width*height);
	 * initnet(pic,3*width*height,samplefac); learn(); unbiasnet(); [write output
	 * image header, using writecolourmap(f)] inxbuild(); write output image using
	 * inxsearch(b,g,r)
	 */

	/*
	 * Network Definitions -------------------
	 */

	this.maxnetpos = (this.netsize - 1);
	this.netbiasshift = 4; /* bias for colour values */
	this.ncycles = 100; /* no. of learning cycles */

	/* defs for freq and bias */
	this.intbiasshift = 16; /* bias for fractions */
	this.intbias = (1 << this.intbiasshift);
	this.gammashift = 10; /* gamma = 1024 */
	this.gamma = (1 << this.gammashift);
	this.betashift = 10;
	this.beta = (this.intbias >> this.betashift); /* beta = 1/1024 */
	this.betagamma = (this.intbias << (this.gammashift - this.betashift));

	/* defs for decreasing radius factor */
	this.initrad = (this.netsize >> 3); /* for 256 cols, radius starts */
	this.radiusbiasshift = 6; /* at 32.0 biased by 6 bits */
	this.radiusbias = (1 << this.radiusbiasshift);
	this.initradius = (this.initrad * this.radiusbias); /* and decreases by a */
	this.radiusdec = 30; /* factor of 1/30 each cycle */

	/* defs for decreasing alpha factor */
	this.alphabiasshift = 10; /* alpha starts at 1.0 */
	this.initalpha = (1 << this.alphabiasshift);
	this.alphadec; /* biased by 10 bits */

	/* radbias and alpharadbias used for radpower calculation */
	this.radbiasshift = 8;
	this.radbias = (1 << this.radbiasshift);
	this.alpharadbshift = (this.alphabiasshift + this.radbiasshift);
	this.alpharadbias = (1 << this.alpharadbshift);

	/*
	 * Types and Global Variables --------------------------
	 */

	this.thepicture; /* the input image itself */
	this.lengthcount; /* lengthcount = H*W*3 */
	this.samplefac; /* sampling factor 1..30 */

	// typedef int pixel[4]; /* BGRc */
	this.network; /* the network itself - [netsize][4] */
	this.netindex = [];

	/* for network lookup - really 256 */
	this.bias = [];

	/* bias and freq arrays for learning */
	this.freq = [];
	this.radpower = [];

	}

	NeuQuantinit (thepic, len, sample) {

		var i;
		var p;

		this.thepicture = thepic;
		this.lengthcount = len;
		this.samplefac = sample;

		this.network = new Array(this.netsize);

		for (i = 0; i < this.netsize; i++) {

			this.network[i] = new Array(4);
			p = this.network[i];
			p[0] = p[1] = p[2] = (i << (this.netbiasshift + 8)) / this.netsize;
			this.freq[i] = this.intbias / this.netsize; /* 1/netsize */
			this.bias[i] = 0;
		}
	};

	colorMap() {

		var map = [];
		var index = new Array(this.netsize);

		for (var i = 0; i < this.netsize; i++)
			index[this.network[i][3]] = i;

		var k = 0;
		for (var l = 0; l < this.netsize; l++) {
			var j = index[l];
			map[k++] = (this.network[j][0]);
			map[k++] = (this.network[j][1]);
			map[k++] = (this.network[j][2]);
		}

		return map;
	};

	/*
	 * Insertion sort of network and building of netindex[0..255] (to do after
	 * unbias)
	 * -------------------------------------------------------------------------------
	 */

	inxbuild() {

		var i;
		var j;
		var smallpos;
		var smallval;
		var p;
		var q;
		var previouscol;
		var startpos;

		previouscol = 0;
		startpos = 0;
		for (i = 0; i < this.netsize; i++) {

			p = this.network[i];
			smallpos = i;
			smallval = p[1]; /* index on g */

			/* find smallest in i..this.netsize-1 */
			for (j = i + 1; j < this.netsize; j++) {

				q = this.network[j];
				if (q[1] < smallval) { /* index on g */
					smallpos = j;
					smallval = q[1]; /* index on g */
				}
			}
			q = this.network[smallpos];

			/* swap p (i) and q (smallpos) entries */
			if (i != smallpos) {
				j = q[0];
				q[0] = p[0];
				p[0] = j;
				j = q[1];
				q[1] = p[1];
				p[1] = j;
				j = q[2];
				q[2] = p[2];
				p[2] = j;
				j = q[3];
				q[3] = p[3];
				p[3] = j;
			}

			/* smallval entry is now in position i */

			if (smallval != previouscol) {

				this.netindex[previouscol] = (startpos + i) >> 1;

				for (j = previouscol + 1; j < smallval; j++) this.netindex[j] = i;

				previouscol = smallval;
				startpos = i;
			}
		}

		this.netindex[previouscol] = (startpos + this.maxnetpos) >> 1;
		for (j = previouscol + 1; j < 256; j++) this.netindex[j] = this.maxnetpos; /* really 256 */
	};

	/*
	 * Main Learning Loop ------------------
	 */

	learn() {

		var i;
		var j;
		var b;
		var g;
		var r;
		var radius;
		var rad;
		var alpha;
		var step;
		var delta;
		var samplepixels;
		var p;
		var pix;
		var lim;

		if (this.lengthcount < this.minpicturebytes) this.samplefac = 1;

		this.alphadec = 30 + ((this.samplefac - 1) / 3);
		p = this.thepicture;
		pix = 0;
		lim = this.lengthcount;
		samplepixels = this.lengthcount / (3 * this.samplefac);
		delta = (samplepixels / this.ncycles) | 0;
		alpha = this.initalpha;
		radius = this.initradius;

		rad = radius >> this.radiusbiasshift;
		if (rad <= 1) rad = 0;

		for (i = 0; i < rad; i++) this.radpower[i] = alpha * (((rad * rad - i * i) * this.radbias) / (rad * rad));

		if (this.lengthcount < this.minpicturebytes) step = 3;

		else if ((this.lengthcount % this.prime1) !== 0) step = 3 * this.prime1;

		else {

			if ((this.lengthcount % this.prime2) !== 0) step = 3 * this.prime2;
			else {
				if ((this.lengthcount % this.prime3) !== 0) step = 3 * this.prime3;
				else step = 3 * this.prime4;
			}
		}

		i = 0;
		while (i < samplepixels) {

			b = (p[pix + 0] & 0xff) << this.netbiasshift;
			g = (p[pix + 1] & 0xff) << this.netbiasshift;
			r = (p[pix + 2] & 0xff) << this.netbiasshift;
			j = this.contest(b, g, r);

			this.altersingle(alpha, j, b, g, r);
			if (rad !== 0) this.alterneigh(rad, j, b, g, r); /* alter neighbours */

			pix += step;
			if (pix >= lim) pix -= this.lengthcount;

			i++;

			if (delta === 0) delta = 1;

			if (i % delta === 0) {
				alpha -= alpha / this.alphadec;
				radius -= radius / this.radiusdec;
				rad = radius >> this.radiusbiasshift;

				if (rad <= 1) rad = 0;

				for (j = 0; j < rad; j++) this.radpower[j] = alpha * (((rad * rad - j * j) * this.radbias) / (rad * rad));
			}
		}
	};

	/*
	 ** Search for BGR values 0..255 (after net is unbiased) and return colour
	 * index
	 * ----------------------------------------------------------------------------
	 */

	map(b, g, r) {

		var i;
		var j;
		var dist;
		var a;
		var bestd;
		var p;
		var best;

		bestd = 1000; /* biggest possible dist is 256*3 */
		best = -1;
		i = this.netindex[g]; /* index on g */
		j = i - 1; /* start at netindex[g] and work outwards */

		while ((i < this.netsize) || (j >= 0)) {

			if (i < this.netsize) {
				p = this.network[i];
				dist = p[1] - g; /* inx key */

				if (dist >= bestd) i = this.netsize; /* stop iter */

				else {

					i++;
					if (dist < 0) dist = -dist;
					a = p[0] - b;
					if (a < 0) a = -a;
					dist += a;

					if (dist < bestd) {
						a = p[2] - r;
						if (a < 0) a = -a;
						dist += a;

						if (dist < bestd) {
							bestd = dist;
							best = p[3];
						}
					}
				}
			}

			if (j >= 0) {

				p = this.network[j];
				dist = g - p[1]; /* inx key - reverse dif */

				if (dist >= bestd) j = -1; /* stop iter */

				else {

					j--;
					if (dist < 0) dist = -dist;
					a = p[0] - b;
					if (a < 0) a = -a;
					dist += a;

					if (dist < bestd) {
						a = p[2] - r;
						if (a < 0) a = -a;
						dist += a;
						if (dist < bestd) {
							bestd = dist;
							best = p[3];
						}
					}
				}
			}
		}

		return (best);
	};

	process() {
		this.learn();
		this.unbiasnet();
		this.inxbuild();
		return this.colorMap();
	};

	/*
	 * Unbias network to give byte values 0..255 and record position i to prepare
	 * for sort
	 * -----------------------------------------------------------------------------------
	 */

	unbiasnet() {

		var i;
		var j;

		for (i = 0; i < this.netsize; i++) {
			this.network[i][0] >>= this.netbiasshift;
			this.network[i][1] >>= this.netbiasshift;
			this.network[i][2] >>= this.netbiasshift;
			this.network[i][3] = i; /* record colour no */
		}
	};

	/*
	 * Move adjacent neurons by precomputed alpha*(1-((i-j)^2/[r]^2)) in
	 * radpower[|i-j|]
	 * ---------------------------------------------------------------------------------
	 */

	alterneigh(rad, i, b, g, r) {

		var j;
		var k;
		var lo;
		var hi;
		var a;
		var m;
		var p;

		lo = i - rad;
		if (lo < -1) lo = -1;

		hi = i + rad;
		if (hi > this.netsize) hi = this.netsize;

		j = i + 1;
		k = i - 1;
		m = 1;

		while ((j < hi) || (k > lo)) {
			a = this.radpower[m++];

			if (j < hi) {
				p = this.network[j++];

				try {
					p[0] -= (a * (p[0] - b)) / this.alpharadbias;
					p[1] -= (a * (p[1] - g)) / this.alpharadbias;
					p[2] -= (a * (p[2] - r)) / this.alpharadbias;
				} catch (e) {} // prevents 1.3 miscompilation
			}

			if (k > lo) {
				p = this.network[k--];

				try {
					p[0] -= (a * (p[0] - b)) / this.alpharadbias;
					p[1] -= (a * (p[1] - g)) / this.alpharadbias;
					p[2] -= (a * (p[2] - r)) / this.alpharadbias;
				} catch (e) {}
			}
		}
	};

	/*
	 * Move neuron i towards biased (b,g,r) by factor alpha
	 * ----------------------------------------------------
	 */

	altersingle(alpha, i, b, g, r) {

		/* alter hit neuron */
		var n = this.network[i];
		n[0] -= (alpha * (n[0] - b)) / this.initalpha;
		n[1] -= (alpha * (n[1] - g)) / this.initalpha;
		n[2] -= (alpha * (n[2] - r)) / this.initalpha;
	};

	/*
	 * Search for biased BGR values ----------------------------
	 */

	contest(b, g, r) {

		/* finds closest neuron (min dist) and updates freq */
		/* finds best neuron (min dist-bias) and returns position */
		/* for frequently chosen neurons, freq[i] is high and bias[i] is negative */
		/* bias[i] = gamma*((1/netsize)-freq[i]) */

		var i;
		var dist;
		var a;
		var biasdist;
		var betafreq;
		var bestpos;
		var bestbiaspos;
		var bestd;
		var bestbiasd;
		var n;

		bestd = ~ (1 << 31);
		bestbiasd = bestd;
		bestpos = -1;
		bestbiaspos = bestpos;

		for (i = 0; i < this.netsize; i++) {
			n = this.network[i];
			dist = n[0] - b;
			if (dist < 0) dist = -dist;
			a = n[1] - g;
			if (a < 0) a = -a;
			dist += a;
			a = n[2] - r;
			if (a < 0) a = -a;
			dist += a;

			if (dist < bestd) {
				bestd = dist;
				bestpos = i;
			}

			biasdist = dist - ((this.bias[i]) >> (this.intbiasshift - this.netbiasshift));

			if (biasdist < bestbiasd) {
				bestbiasd = biasdist;
				bestbiaspos = i;
			}

			betafreq = (this.freq[i] >> this.betashift);
			this.freq[i] -= betafreq;
			this.bias[i] += (betafreq << this.gammashift);
		}

		this.freq[bestpos] += this.beta;
		this.bias[bestpos] -= this.betagamma;
		return bestbiaspos;
	};
};

module.exports = NeuQuant;