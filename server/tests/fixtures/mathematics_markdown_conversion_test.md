# Mathematics and Markdown Conversion Test Document

**Purpose:** A comprehensive stress-test document for converting
Markdown (`.md`) into Word (`.docx`) and PDF. It includes common
mathematical notation, structured content, tables, lists, code, and
mixed formatting.

> **Rendering note:** Mathematical expressions use LaTeX delimiters.
> Your converter should preserve or render both inline math (`$...$`)
> and display math (`$$...$$`) consistently.

------------------------------------------------------------------------

## 1. Basic Arithmetic and Number Sets

Inline examples: (2+3=5), (7-4=3), (6`\times 8`{=tex}=48), and
(15`\div 3`{=tex}=5).

  Symbol                 Meaning            Example
  ---------------------- ------------------ ---------------------------------------------
  (`\mathbb{N}`{=tex})   Natural numbers    (1,2,3,`\ldots`{=tex})
  (`\mathbb{Z}`{=tex})   Integers           (`\ldots`{=tex},-2,-1,0,1,2,`\ldots`{=tex})
  (`\mathbb{Q}`{=tex})   Rational numbers   (`\frac{3}{4}`{=tex})
  (`\mathbb{R}`{=tex})   Real numbers       (`\sqrt{2}`{=tex},`\pi`{=tex})
  (`\mathbb{C}`{=tex})   Complex numbers    (2+3i)

### Fractions, powers, and roots

\[
`\frac{a}{b}`{=tex}+`\frac{c}{d}`{=tex}=`\frac{ad+bc}{bd}`{=tex},`\qquad `{=tex}b,d`\ne 0`{=tex}
\]

\[ a\^m a^n=a^{m+n},`\qquad`{=tex}
`\frac{a^m}{a^n}`{=tex}=a\^{m-n},`\qquad`{=tex} (a^m)^n=a\^{mn} \]

\[ `\sqrt[n]{a}`{=tex}=a\^{1/n},`\qquad`{=tex} `\sqrt{a^2}`{=tex}=\|a\|
\]

### Absolute value and inequalities

\[ \|x\| =
```{=tex}
\begin{cases}
x, & x\geq 0,\\
-x, & x<0.
\end{cases}
```
\]

\[ a\<b `\Rightarrow `{=tex}a+c\<b+c \]

\[ ac\<bc `\quad `{=tex}`\text{if }`{=tex} a\<b `\text{ and }`{=tex}
c\>0 \]

------------------------------------------------------------------------

## 2. Algebra

### Common identities

\[ (a+b)^2=a^2+2ab+b\^2 \]

\[ (a-b)^2=a^2-2ab+b\^2 \]

\[ a^2-b^2=(a-b)(a+b) \]

\[ (a+b)^3=a^3+3a^2b+3ab^2+b\^3 \]

### Linear equation

Solve:

\[ 3x+7=22 \]

\[ 3x=22-7=15 \]

\[ `\boxed{x=5}`{=tex} \]

### Quadratic equation

For (ax\^2+bx+c=0), the quadratic formula is

\[
x=`\frac{-b\pm\sqrt{b^2-4ac}}{2a}`{=tex},`\qquad `{=tex}a`\ne 0`{=tex}
\]

The discriminant is

\[ `\Delta`{=tex}=b\^2-4ac \]

-   If (`\Delta`{=tex}\>0), there are two distinct real roots.
-   If (`\Delta=0`{=tex}), there is one repeated real root.
-   If (`\Delta`{=tex}\<0), there are two complex conjugate roots.

### Polynomial expansion

\[ (x+2)(x^2-3x+4)=x^3-x\^2-2x+8 \]

### Binomial theorem

\[ (x+y)\^n=`\sum`{=tex}\_{k=0}^{n}`\binom{n}{k}`{=tex}x^{n-k}y\^k \]

------------------------------------------------------------------------

## 3. Functions and Graphs

A function maps each element of a domain to exactly one element of a
codomain:

\[ f:A`\rightarrow `{=tex}B \]

Examples:

\[ f(x)=x\^2+2x-3 \]

\[
g(x)=`\sin `{=tex}x,`\qquad `{=tex}h(x)=e\^x,`\qquad `{=tex}p(x)=`\ln `{=tex}x
\]

Composition:

\[ (f`\circ `{=tex}g)(x)=f(g(x)) \]

Inverse function:

\[ f\^{-1}(f(x))=x \]

A simple piecewise function:

\[ f(x)=
```{=tex}
\begin{cases}
x+1, & x<0,\\
x^2, & 0\leq x\leq 2,\\
4x-3, & x>2.
\end{cases}
```
\]

------------------------------------------------------------------------

## 4. Trigonometry

### Fundamental identities

\[ `\sin`{=tex}^2`\theta`{=tex}+`\cos`{=tex}^2`\theta=1`{=tex} \]

\[ 1+`\tan`{=tex}^2`\theta`{=tex}=`\sec`{=tex}^2`\theta`{=tex} \]

\[ 1+`\cot`{=tex}^2`\theta`{=tex}=`\csc`{=tex}^2`\theta`{=tex} \]

### Angle sum and difference

\[ `\sin`{=tex}(`\alpha`{=tex}`\pm`{=tex}`\beta`{=tex})=
`\sin`{=tex}`\alpha`{=tex}`\cos`{=tex}`\beta`{=tex}`\pm`{=tex}`\cos`{=tex}`\alpha`{=tex}`\sin`{=tex}`\beta`{=tex}
\]

\[ `\cos`{=tex}(`\alpha`{=tex}`\pm`{=tex}`\beta`{=tex})=
`\cos`{=tex}`\alpha`{=tex}`\cos`{=tex}`\beta`{=tex}`\mp`{=tex}`\sin`{=tex}`\alpha`{=tex}`\sin`{=tex}`\beta`{=tex}
\]

### Double-angle identities

\[
`\sin 2`{=tex}`\theta=2`{=tex}`\sin`{=tex}`\theta`{=tex}`\cos`{=tex}`\theta`{=tex}
\]

\[
`\cos 2`{=tex}`\theta`{=tex}=`\cos`{=tex}^2`\theta`{=tex}-`\sin`{=tex}^2`\theta
=1`{=tex}-2`\sin`{=tex}\^2`\theta`{=tex} \]

### Euler's formula

\[
e\^{i`\theta`{=tex}}=`\cos`{=tex}`\theta`{=tex}+i`\sin`{=tex}`\theta`{=tex}
\]

------------------------------------------------------------------------

## 5. Geometry and Mensuration

  Shape                Area                      Perimeter / Circumference
  -------------------- ------------------------- ---------------------------
  Square, side (a)     (a\^2)                    (4a)
  Rectangle            (lw)                      (2(l+w))
  Circle, radius (r)   (`\pi `{=tex}r\^2)        (2`\pi `{=tex}r)
  Triangle             (`\frac12`{=tex} bh)      (a+b+c)
  Trapezoid            (`\frac12`{=tex}(a+b)h)   Sum of all sides

### Pythagorean theorem

\[ a^2+b^2=c\^2 \]

### Heron's formula

For side lengths (a,b,c), let (s=(a+b+c)/2). Then

\[ A=`\sqrt{s(s-a)(s-b)(s-c)}`{=tex} \]

### Volume

\[ V\_{`\text{cube}`{=tex}}=a\^3,`\qquad`{=tex}
V\_{`\text{cylinder}`{=tex}}=`\pi `{=tex}r\^2h \]

\[
V\_{`\text{sphere}`{=tex}}=`\frac43`{=tex}`\pi `{=tex}r\^3,`\qquad`{=tex}
V\_{`\text{cone}`{=tex}}=`\frac13`{=tex}`\pi `{=tex}r\^2h \]

------------------------------------------------------------------------

## 6. Coordinate Geometry and Vectors

Distance between two points:

\[ d=`\sqrt{(x_2-x_1)^2+(y_2-y_1)^2}`{=tex} \]

Midpoint:

\[
M=`\left`{=tex}(`\frac{x_1+x_2}{2}`{=tex},`\frac{y_1+y_2}{2}`{=tex}`\right`{=tex})
\]

Slope:

\[ m=`\frac{y_2-y_1}{x_2-x_1}`{=tex} \]

Dot product:

\[ `\mathbf{a}`{=tex}`\cdot`{=tex}`\mathbf{b}`{=tex}
=a_1b_1+a_2b_2+a_3b_3
=\|`\mathbf{a}`{=tex}\|\|`\mathbf{b}`{=tex}\|`\cos`{=tex}`\theta`{=tex}
\]

Cross product:

\[ `\mathbf{a}`{=tex}`\times`{=tex}`\mathbf{b}`{=tex}=
```{=tex}
\begin{vmatrix}
\mathbf{i}&\mathbf{j}&\mathbf{k}\\
a_1&a_2&a_3\\
b_1&b_2&b_3
\end{vmatrix}
```
\]

Vector magnitude:

\[ \|`\mathbf{v}`{=tex}\|=`\sqrt{v_x^2+v_y^2+v_z^2}`{=tex} \]

------------------------------------------------------------------------

## 7. Matrices and Linear Algebra

A general (2`\times 2`{=tex}) matrix:

\[ A=
```{=tex}
\begin{bmatrix}a&b\\c&d\end{bmatrix}
```
\]

Determinant:

\[ `\det`{=tex}(A)=ad-bc \]

Inverse, when (ad-bc`\ne 0`{=tex}):

\[ A\^{-1}=`\frac{1}{ad-bc}`{=tex}
```{=tex}
\begin{bmatrix}d&-b\\-c&a\end{bmatrix}
```
\]

Matrix multiplication:

\[ AB=
```{=tex}
\begin{bmatrix}
a&b\\c&d
\end{bmatrix}
\begin{bmatrix}
e&f\\g&h
\end{bmatrix}
```
=
```{=tex}
\begin{bmatrix}
ae+bg&af+bh\\
ce+dg&cf+dh
\end{bmatrix}
```
\]

A (3`\times 3`{=tex}) matrix:

\[ B=
```{=tex}
\begin{bmatrix}
1&2&3\\
0&-1&4\\
5&2&0
\end{bmatrix}
```
\]

Eigenvalue equation:

\[ A`\mathbf{v}`{=tex}=`\lambda`{=tex}`\mathbf{v}`{=tex} \]

Characteristic equation:

\[ `\det`{=tex}(A-`\lambda `{=tex}I)=0 \]

------------------------------------------------------------------------

## 8. Sequences and Series

Arithmetic sequence:

\[ a_n=a_1+(n-1)d \]

Arithmetic series:

\[ S_n=`\frac{n}{2}`{=tex}`\left`{=tex}(2a_1+(n-1)d`\right`{=tex}) \]

Geometric sequence:

\[ a_n=a_1r\^{n-1} \]

Finite geometric series:

\[ S_n=a_1`\frac{1-r^n}{1-r}`{=tex},`\qquad `{=tex}r`\ne 1`{=tex} \]

Infinite geometric series, for (\|r\|\<1):

\[ S\_`\infty`{=tex}=`\frac{a_1}{1-r}`{=tex} \]

Summation notation:

\[ `\sum`{=tex}\_{k=1}\^{n}k=`\frac{n(n+1)}{2}`{=tex} \]

\[ `\sum`{=tex}\_{k=1}^{n}k^2=`\frac{n(n+1)(2n+1)}{6}`{=tex} \]

------------------------------------------------------------------------

## 9. Differential Calculus

Limit definition:

\[ `\lim`{=tex}\_{x`\to `{=tex}a}f(x)=L \]

Derivative definition:

\[ f'(x)=`\lim`{=tex}\_{h`\to 0`{=tex}}`\frac{f(x+h)-f(x)}{h}`{=tex} \]

Common derivatives:

\[ `\frac{d}{dx}`{=tex}(x^n)=nx^{n-1} \]

\[ `\frac{d}{dx}`{=tex}(`\sin `{=tex}x)=`\cos `{=tex}x,`\qquad`{=tex}
`\frac{d}{dx}`{=tex}(`\cos `{=tex}x)=-`\sin `{=tex}x \]

\[ `\frac{d}{dx}`{=tex}(e^x)=e^x,`\qquad`{=tex}
`\frac{d}{dx}`{=tex}(`\ln `{=tex}x)=`\frac{1}{x}`{=tex} \]

Product rule:

\[ (uv)'=u'v+uv' \]

Quotient rule:

\[
`\left`{=tex}(`\frac{u}{v}`{=tex}`\right`{=tex})'=`\frac{u'v-uv'}{v^2}`{=tex}
\]

Chain rule:

\[ `\frac{dy}{dx}`{=tex}=`\frac{dy}{du}`{=tex}`\frac{du}{dx}`{=tex} \]

Second derivative:

\[ f''(x)=`\frac{d^2f}{dx^2}`{=tex} \]

------------------------------------------------------------------------

## 10. Integral Calculus

Indefinite integral:

\[ `\int `{=tex}f(x),dx=F(x)+C \]

Power rule:

\[
`\int `{=tex}x\^n,dx=`\frac{x^{n+1}}{n+1}`{=tex}+C,`\qquad `{=tex}n`\ne -1`{=tex}
\]

Common integrals:

\[ `\int `{=tex}`\frac{1}{x}`{=tex},dx=`\ln`{=tex}\|x\|+C \]

\[ `\int `{=tex}e^x,dx=e^x+C \]

\[ `\int `{=tex}`\cos `{=tex}x,dx=`\sin `{=tex}x+C \]

Definite integral:

\[ `\int`{=tex}\_a\^b f(x),dx=F(b)-F(a) \]

Integration by parts:

\[ `\int `{=tex}u,dv=uv-`\int `{=tex}v,du \]

Substitution:

\[ u=g(x),`\qquad `{=tex}du=g'(x),dx \]

Double integral:

\[ `\iint`{=tex}\_R f(x,y),dA \]

Triple integral:

\[ `\iiint`{=tex}\_V f(x,y,z),dV \]

------------------------------------------------------------------------

## 11. Differential Equations

First-order linear differential equation:

\[ `\frac{dy}{dx}`{=tex}+P(x)y=Q(x) \]

Separable equation:

\[ `\frac{dy}{dx}`{=tex}=g(x)h(y) \]

Second-order linear equation:

\[ a`\frac{d^2y}{dx^2}`{=tex} +b`\frac{dy}{dx}`{=tex}+cy=f(x) \]

Example exponential decay:

\[ `\frac{dN}{dt}`{=tex}=-kN \]

\[ N(t)=N_0e\^{-kt} \]

------------------------------------------------------------------------

## 12. Probability and Statistics

Probability:

\[ P(A)=`\frac{\text{Number of favourable outcomes}}`{=tex}
{`\text{Total number of equally likely outcomes}`{=tex}} \]

Complement:

\[ P(A\^c)=1-P(A) \]

Addition rule:

\[ P(A`\cup `{=tex}B)=P(A)+P(B)-P(A`\cap `{=tex}B) \]

Conditional probability:

\[ P(A`\mid `{=tex}B)=`\frac{P(A\cap B)}{P(B)}`{=tex} \]

Bayes' theorem:

\[ P(A`\mid `{=tex}B)=`\frac{P(B\mid A)P(A)}{P(B)}`{=tex} \]

Mean:

\[ `\bar`{=tex}{x}=`\frac{1}{n}`{=tex}`\sum`{=tex}\_{i=1}\^{n}x_i \]

Population variance:

\[
`\sigma`{=tex}\^2=`\frac{1}{N}`{=tex}`\sum`{=tex}\_{i=1}^{N}(x_i-`\mu`{=tex})^2
\]

Sample standard deviation:

\[ s=`\sqrt{\frac{\sum_{i=1}^{n}(x_i-\bar{x})^2}{n-1}}`{=tex} \]

Binomial probability:

\[ P(X=k)=`\binom{n}{k}`{=tex}p^k(1-p)^{n-k} \]

Normal distribution density:

\[ f(x)=`\frac{1}{\sigma\sqrt{2\pi}}`{=tex}
e\^{-`\frac{(x-\mu)^2}{2\sigma^2}`{=tex}} \]

------------------------------------------------------------------------

## 13. Complex Numbers

\[ z=a+bi,`\qquad `{=tex}i\^2=-1 \]

Complex conjugate:

\[ `\overline{z}`{=tex}=a-bi \]

Modulus:

\[ \|z\|=`\sqrt{a^2+b^2}`{=tex} \]

Polar form:

\[
z=r(`\cos`{=tex}`\theta`{=tex}+i`\sin`{=tex}`\theta`{=tex})=re\^{i`\theta`{=tex}}
\]

De Moivre's theorem:

\[ (`\cos`{=tex}`\theta`{=tex}+i`\sin`{=tex}`\theta`{=tex})\^n
=`\cos`{=tex}(n`\theta`{=tex})+i`\sin`{=tex}(n`\theta`{=tex}) \]

------------------------------------------------------------------------

## 14. Discrete Mathematics and Logic

Logical operators:

  Operator      Symbol                      Meaning
  ------------- --------------------------- ----------------------
  AND           (`\land`{=tex})             Both statements true
  OR            (`\lor`{=tex})              At least one true
  NOT           (`\neg`{=tex})              Negation
  Implication   (`\Rightarrow`{=tex})       If...then
  Equivalence   (`\Leftrightarrow`{=tex})   If and only if

De Morgan's laws:

\[
`\neg`{=tex}(P`\land `{=tex}Q)`\equiv`{=tex}(`\neg `{=tex}P)`\lor`{=tex}(`\neg `{=tex}Q)
\]

\[
`\neg`{=tex}(P`\lor `{=tex}Q)`\equiv`{=tex}(`\neg `{=tex}P)`\land`{=tex}(`\neg `{=tex}Q)
\]

Set operations:

\[
A`\cup `{=tex}B,`\qquad `{=tex}A`\cap `{=tex}B,`\qquad `{=tex}A`\setminus `{=tex}B,`\qquad `{=tex}A\^c
\]

Cardinality:

\[ \|A`\cup `{=tex}B\|=\|A\|+\|B\|-\|A`\cap `{=tex}B\| \]

------------------------------------------------------------------------

## 15. Engineering Mathematics and Physics

Ohm's law:

\[ V=IR \]

Electrical power:

\[ P=VI=I\^2R=`\frac{V^2}{R}`{=tex} \]

Capacitor relation:

\[ i(t)=C`\frac{dv(t)}{dt}`{=tex} \]

Inductor relation:

\[ v(t)=L`\frac{di(t)}{dt}`{=tex} \]

Angular frequency:

\[ `\omega=2`{=tex}`\pi `{=tex}f \]

Wave equation:

\[ v=f`\lambda`{=tex} \]

Newton's second law:

\[ `\sum `{=tex}`\mathbf{F}`{=tex}=m`\mathbf{a}`{=tex} \]

Kinetic energy:

\[ E_k=`\frac12`{=tex} mv\^2 \]

Potential energy:

\[ E_p=mgh \]

Ideal gas law:

\[ PV=nRT \]

------------------------------------------------------------------------

## 16. Optimization

Objective function:

\[ `\min`{=tex}\_{`\mathbf{x}`{=tex}`\in`{=tex}`\mathbb{R}`{=tex}\^n}
f(`\mathbf{x}`{=tex}) \]

Subject to constraints:

\[ g_i(`\mathbf{x}`{=tex})`\leq 0`{=tex},`\qquad`{=tex}
h_j(`\mathbf{x}`{=tex})=0 \]

Gradient:

\[ `\nabla `{=tex}f=
```{=tex}
\begin{bmatrix}
\frac{\partial f}{\partial x_1}\\
\frac{\partial f}{\partial x_2}\\
\vdots\\
\frac{\partial f}{\partial x_n}
\end{bmatrix}
```
\]

Lagrangian:

\[ `\mathcal{L}`{=tex}(`\mathbf{x}`{=tex},`\lambda`{=tex})
=f(`\mathbf{x}`{=tex})+`\lambda `{=tex}g(`\mathbf{x}`{=tex}) \]

------------------------------------------------------------------------

## 17. More Advanced Notation

Partial derivative:

\[ `\frac{\partial f}{\partial x}`{=tex} \]

Gradient, divergence, and curl:

\[ `\nabla `{=tex}f,`\qquad`{=tex}
`\nabla`{=tex}`\cdot`{=tex}`\mathbf{F}`{=tex},`\qquad`{=tex}
`\nabla`{=tex}`\times`{=tex}`\mathbf{F}`{=tex} \]

Fourier transform:

\[ `\mathcal{F}`{=tex}{f(t)}(`\omega`{=tex})
=`\int`{=tex}\_{-`\infty`{=tex}}^{`\infty`{=tex}}f(t)e^{-i`\omega `{=tex}t},dt
\]

Laplace transform:

\[ `\mathcal{L}`{=tex}{f(t)}(s)
=`\int`{=tex}\_0^`\infty `{=tex}e^{-st}f(t),dt \]

A limit involving infinity:

\[
`\lim`{=tex}\_{n`\to`{=tex}`\infty`{=tex}}`\left`{=tex}(1+`\frac{1}{n}`{=tex}`\right`{=tex})\^n=e
\]

A contour integral:

\[ `\oint`{=tex}\_C f(z),dz \]

A product:

\[ `\prod`{=tex}\_{k=1}\^{n}k=n! \]

------------------------------------------------------------------------

## 18. Units, Greek Letters, and Special Symbols

Greek letters:

\[
`\alpha`{=tex},`\beta`{=tex},`\gamma`{=tex},`\delta`{=tex},`\epsilon`{=tex},`\theta`{=tex},`\lambda`{=tex},`\mu`{=tex},`\pi`{=tex},`\rho`{=tex},`\sigma`{=tex},`\phi`{=tex},`\omega`{=tex}
\]

Common symbols:

\[
`\pm`{=tex}, `\times`{=tex}, `\div`{=tex}, `\approx`{=tex}, `\neq`{=tex}, `\leq`{=tex}, `\geq`{=tex}, `\infty`{=tex}, `\therefore`{=tex}, `\because`{=tex}
\]

Units and scientific notation:

-   (1,`\text{kW}`{=tex}=1000,`\text{W}`{=tex})
-   (1,`\text{MHz}`{=tex}=10\^6,`\text{Hz}`{=tex})
-   (c`\approx 3.00`{=tex}`\times 10`{=tex}\^8,`\text{m/s}`{=tex})
-   (g`\approx 9.81`{=tex},`\text{m/s}`{=tex}\^2)
-   (1,`\mu`{=tex}`\text{F}`{=tex}=10\^{-6},`\text{F}`{=tex})

------------------------------------------------------------------------

## 19. Markdown Feature Tests

### Text formatting

This is **bold text**, this is *italic text*, this is ~~strikethrough~~,
and this is `inline code`.

### Nested lists

1.  Mathematics
    -   Algebra
    -   Calculus
        1.  Differentiation
        2.  Integration
2.  Engineering
    -   Electrical
    -   Mechanical

### Task list

-   [x] Include headings and paragraphs
-   [x] Include tables and lists
-   [x] Include inline and display equations
-   [ ] Verify equations in the exported DOCX
-   [ ] Verify page breaks and equation layout in the exported PDF

### Block quote

> Mathematics is the language in which many scientific relationships are
> expressed.
>
> A good conversion should preserve the structure and meaning of the
> source.

### Code block

``` python
def quadratic_roots(a, b, c):
    discriminant = b**2 - 4*a*c
    root1 = (-b + discriminant**0.5) / (2*a)
    root2 = (-b - discriminant**0.5) / (2*a)
    return root1, root2

print(quadratic_roots(1, -5, 6))
```

### Horizontal rule

------------------------------------------------------------------------

## 20. Final Mixed-Content Stress Test

The displacement of an object under constant acceleration is given by

\[ s=u t+`\frac{1}{2}`{=tex}at\^2 \]

where:

-   \(s\) = displacement in metres (m)
-   \(u\) = initial velocity in metres per second (m/s)
-   \(a\) = acceleration in metres per second squared (m/s²)
-   \(t\) = time in seconds (s)

For (u=5,`\text{m/s}`{=tex}), (a=2,`\text{m/s}`{=tex}\^2), and
(t=4,`\text{s}`{=tex}):

\[ s=(5)(4)+`\frac12`{=tex}(2)(4)\^2 =20+16
=`\boxed{36\,\text{m}}`{=tex} \]

**End of test document.**
